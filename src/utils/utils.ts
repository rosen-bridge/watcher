import * as ergoLib from "ergo-lib-wasm-nodejs";
import * as wasm from "ergo-lib-wasm-nodejs";
import { Config } from "../config/config";
import { WatcherDataBase } from "../database/models/watcherModel";
import { Transaction } from "../api/Transaction";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";
import { NoObservationStatus } from "../errors/errors";
import { TxStatus } from "../database/entities/observationStatusEntity";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { CommitmentSet } from "./interfaces";
import { TxType } from "../database/entities/txEntity";
import { Buffer } from "buffer";

const config = Config.getConfig();

/**
 * returns the decoded input hex string
 * @param str
 */
const hexStrToUint8Array = (str: string): Uint8Array => {
    return new Uint8Array(Buffer.from(str, "hex"))
}

/**
 * Encodes the uint array to the hex string
 * @param buffer
 */
const uint8ArrayToHex = (buffer: Uint8Array): string => {
    return Buffer.from(buffer).toString('hex');
}

/**
 * returns the decoded bigint input
 * @param num
 */
function bigIntToUint8Array(num: bigint) {
    const b = new ArrayBuffer(8)
    new DataView(b).setBigUint64(0, num);
    return new Uint8Array(b);
}

/**
 * returns the decoded base64 input string
 * @param base64
 */
const base64ToArrayBuffer = (base64: string): Uint8Array => {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
};

/**
 * create delay in process running
 * @param time
 */
function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * returns a random secret key along with its associate address
 * @param config
 */
const generateSK = (config: Config): { address: string, secret: string} => {
    const secretKey= ergoLib.SecretKey.random_dlog();
    return {
        address: secretKey.get_address().to_base58(config.networkType),
        secret: uint8ArrayToHex(secretKey.to_bytes())
    };
}

class WatcherUtils {
    dataBase: WatcherDataBase
    api: Transaction
    observationConfirmation: number
    observationValidThreshold: number

    constructor(db: WatcherDataBase, api: Transaction, confirmation: number, validThreshold: number) {
        this.dataBase = db
        this.api = api
        this.observationConfirmation = confirmation
        this.observationValidThreshold = validThreshold
    }

    /**
     * Checks if the observation is valid for commitment creation
     * @param observation
     */
    isObservationValid = async (observation: ObservationEntity): Promise<boolean> => {
        const observationStatus = await this.dataBase.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new NoObservationStatus(`observation with requestId ${observation.requestId} has no status`)
        // Check observation time out
        if (observationStatus.status == TxStatus.TIMED_OUT) return false
        const currentHeight = await this.dataBase.getLastBlockHeight(config.networkWatcher)
        if (currentHeight - observation.height > this.observationValidThreshold) {
            await this.dataBase.updateObservationTxStatus(observation, TxStatus.TIMED_OUT)
            return false
        }
        // check observation trigger created
        if (await this.isMergeHappened(observation)) return false
        // check this watcher have created the commitment lately
        const relatedCommitments = await this.dataBase.commitmentsByEventId(observation.requestId)
        if (relatedCommitments.filter(commitment => commitment.WID === this.api.watcherWID).length > 0) return false
        return true
    }

    /**
     * returns true if the event trigger for the event have been created
     * @param observation
     */
    isMergeHappened = async (observation: ObservationEntity): Promise<boolean> => {
        const observationStatus = await this.dataBase.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new NoObservationStatus(`observation with requestId ${observation.requestId} has no status`)
        if (observationStatus.status == TxStatus.REVEALED) return true
        const eventTrigger = await this.dataBase.eventTriggerBySourceTxId(observation.sourceTxId)
        if (eventTrigger) {
            const height = await ErgoNetwork.getHeight()
            if (height - eventTrigger.height > config.transactionConfirmation)
                await this.dataBase.updateObservationTxStatus(observation, TxStatus.REVEALED)
            return true
        }
        return false
    }

    /**
     * Returns all confirmed observations to create new commitments
     */
    allReadyObservations = async (): Promise<Array<ObservationEntity>> => {
        const height = await this.dataBase.getLastBlockHeight(config.networkWatcher)
        const observations = await this.dataBase.getConfirmedObservations(this.observationConfirmation, height);
        const validObservations: Array<ObservationEntity> = [];
        for (const observation of observations) {
            const observationStatus = await this.dataBase.checkNewObservation(observation);
            if (observationStatus.status === TxStatus.NOT_COMMITTED) {
                if (await this.isObservationValid(observation)) {
                    validObservations.push(observation);
                }
            }
        }
        return validObservations
    }

    /**
     * Returns sets of commitments that are ready to be merged into event trigger
     */
    allReadyCommitmentSets = async (): Promise<Array<CommitmentSet>> => {
        const readyCommitments: Array<CommitmentSet> = []
        const height = await this.dataBase.getLastBlockHeight(config.networkWatcher)
        const observations = (await this.dataBase.getConfirmedObservations(this.observationConfirmation, height));
        for (const observation of observations) {
            const observationStatus = await this.dataBase.getStatusForObservations(observation);
            if (observationStatus !== null && observationStatus.status === TxStatus.COMMITTED) {
                const relatedCommitments = await this.dataBase.commitmentsByEventId(observation.requestId)
                if (!(await this.isMergeHappened(observation))) {
                    readyCommitments.push({
                        commitments: relatedCommitments.filter(commitment => commitment.spendBlock == null),
                        observation: observation
                    })
                }
            }
        }
        return readyCommitments
    }
}

class TransactionUtils {
    dataBase: WatcherDataBase

    constructor(db: WatcherDataBase) {
        this.dataBase = db
    }

    /**
     * submits a new transaction and updates the observation tx status
     * @param tx
     * @param observation
     * @param txType
     */
    submitTransaction = async (tx: wasm.Transaction, observation: ObservationEntity, txType: TxType) => {
        const height = await ErgoNetwork.getHeight();
        await this.dataBase.submitTx(
            Buffer.from(tx.sigma_serialize_bytes()).toString("base64"),
            observation.requestId,
            tx.id().to_str(),
            txType,
            height
        )
        await this.dataBase.upgradeObservationTxStatus(observation)
    }
}

export {
    TransactionUtils,
    WatcherUtils,
    hexStrToUint8Array,
    uint8ArrayToHex,
    delay,
    bigIntToUint8Array,
    generateSK,
    base64ToArrayBuffer
}
