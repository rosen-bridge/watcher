import { WatcherDataBase } from "../database/models/watcherModel";
import * as wasm from "ergo-lib-wasm-nodejs";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";
import { TxType } from "../database/entities/txEntity";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { Buffer } from "buffer";
import { Transaction } from "../api/Transaction";
import { NoObservationStatus } from "../errors/errors";
import { TxStatus } from "../database/entities/observationStatusEntity";
import { CommitmentSet } from "./interfaces";
import { Config } from "../config/config";

const config = Config.getConfig();

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

export { TransactionUtils };
export { WatcherUtils };