import { BridgeDataBase } from "./models/bridgeModel";
import { NetworkDataBase } from "./models/networkModel";
import { CommitmentSet } from "../utils/interfaces";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { Config } from "../config/config";
import * as wasm from "ergo-lib-wasm-nodejs";
import { Buffer } from "buffer";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";
import { TxType } from "./entities/TxEntity";
import { TxStatus } from "./entities/ObservationStatusEntity";
import { Transaction } from "../api/Transaction";

const ergoConfig = Config.getConfig();


export class DatabaseConnection{
    bridgeDataBase: BridgeDataBase
    networkDataBase: NetworkDataBase
    api: Transaction
    observationConfirmation: number
    observationValidThreshold: number

    constructor(networkDb: NetworkDataBase, bridgeDb: BridgeDataBase, api: Transaction, confirmation: number, validThreshold: number) {
        this.networkDataBase = networkDb
        this.bridgeDataBase = bridgeDb
        this.api = api
        this.observationConfirmation = confirmation
        this.observationValidThreshold = validThreshold
    }

    /**
     * Checks if the observation is valid for commitment creation
     * @param observation
     */
    isObservationValid = async (observation: ObservationEntity): Promise<boolean> => {
        const observationStatus = await this.networkDataBase.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new Error(`observation with requestId ${observation.requestId} has no status`)
        // Check observation time out
        if (observationStatus.status == TxStatus.TIMED_OUT) return false
        const currentHeight = await ErgoNetwork.getHeight()
        if (currentHeight - observation.height > this.observationValidThreshold) {
            await this.networkDataBase.updateObservationTxStatus(observation, TxStatus.TIMED_OUT)
            return false
        }
        // check observation trigger created
        if (await this.isMergeHappened(observation)) return false
        // check this watcher have created the commitment lately
        const relatedCommitments = await this.bridgeDataBase.commitmentsByEventId(observation.requestId)
        if (relatedCommitments.filter(commitment => commitment.WID === this.api.watcherWID).length > 0) return false
        return true
    }

    /**
     * returns true if the event trigger for the event have been created
     * @param observation
     */
    isMergeHappened = async (observation: ObservationEntity): Promise<boolean> => {
        const observationStatus = await this.networkDataBase.getStatusForObservations(observation);
        if (observationStatus === null)
            throw new Error(`observation with requestId ${observation.requestId} has no status`)
        if (observationStatus.status == TxStatus.REVEALED) return true
        const eventTrigger = await this.bridgeDataBase.eventTriggerBySourceTxId(observation.sourceTxId)
        if (eventTrigger) {
            const height = await ErgoNetwork.getHeight()
            if (height - eventTrigger.height > ergoConfig.transactionConfirmation)
                await this.networkDataBase.updateObservationTxStatus(observation, TxStatus.REVEALED)
            return true
        }
        return false
    }

    /**
     * Returns all confirmed observations to create new commitments
     */
    allReadyObservations = async (): Promise<Array<ObservationEntity>> => {
        const height = await this.networkDataBase.getLastBlockHeight()
        const observations = await this.networkDataBase.getConfirmedObservations(this.observationConfirmation, height);
        const validObservations: Array<ObservationEntity> = [];
        for (const observation of observations) {
            const observationStatus = await this.networkDataBase.setStatusForObservations(observation);
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
        const height = await this.networkDataBase.getLastBlockHeight()
        const observations = (await this.networkDataBase.getConfirmedObservations(this.observationConfirmation, height));
        for (const observation of observations) {
            const observationStatus = await this.networkDataBase.getStatusForObservations(observation);
            if (observationStatus !== null && observationStatus.status === TxStatus.COMMITTED) {
                const relatedCommitments = await this.bridgeDataBase.commitmentsByEventId(observation.requestId)
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

    /**
     * submits a new transaction and updates the observation tx status
     * @param tx
     * @param observation
     * @param txType
     */
    submitTransaction = async (tx: wasm.Transaction, observation: ObservationEntity, txType: TxType) => {
        await this.networkDataBase.submitTx(
            Buffer.from(tx.sigma_serialize_bytes()).toString("base64"),
            observation.requestId,
            tx.id().to_str(),
            txType
        )
        await this.networkDataBase.upgradeObservationTxStatus(observation)
    }
}
