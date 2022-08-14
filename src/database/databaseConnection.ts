import { BridgeDataBase } from "./models/bridgeModel";
import { NetworkDataBase } from "./models/networkModel";
import { CommitmentSet } from "../utils/interfaces";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { ErgoConfig } from "../config/config";
import * as wasm from "ergo-lib-wasm-nodejs";
import { Buffer } from "buffer";
import { ObservationEntity, TxStatus } from "@rosen-bridge/observation-extractor";
import { TxType } from "./entities/watcher/TransactionEntity";

const ergoConfig = ErgoConfig.getConfig();


export class DatabaseConnection {
    bridgeDataBase: BridgeDataBase
    networkDataBase: NetworkDataBase
    observationConfirmation: number
    observationValidThreshold: number

    constructor(networkDb: NetworkDataBase, bridgeDb: BridgeDataBase, confirmation: number, validThreshold: number) {
        this.networkDataBase = networkDb
        this.bridgeDataBase = bridgeDb
        this.observationConfirmation = confirmation
        this.observationValidThreshold = validThreshold
    }

    /**
     * Checks if the observation is valid for commitment creation
     * @param observation
     */
    isObservationValid = async (observation: ObservationEntity): Promise<boolean> => {
        if(observation.status == TxStatus.TIMED_OUT) return false
        const currentHeight = await ErgoNetwork.getHeight()
        if(currentHeight - observation.height > this.observationValidThreshold) {
            await this.networkDataBase.updateObservationTxStatus(observation, TxStatus.TIMED_OUT)
            return false
        }
        else if(await this.isMergeHappened(observation)) return false
        return true
    }

    /**
     * returns true if any commitment boxesSample had been spent to create event trigger
     * @param observation
     */
    isMergeHappened = async (observation: ObservationEntity): Promise<boolean> => {
        if(observation.status == TxStatus.REVEALED) return true
        const commitments = await this.bridgeDataBase.commitmentsByEventId(observation.requestId)
        for(const commitment of commitments){
            // if(commitment.spendBlock && commitment.spendReason && commitment.spendReason === SpendReason.MERGE) {
            //     const height = await ErgoNetwork.getHeight()
            //     if(height - commitment.spendBlock.height > ergoConfig.transactionConfirmation)
            //         await this.networkDataBase.updateObservationTxStatus(observation, TxStatus.REVEALED)
            //     return true
            // }
        }
        return false
    }

    /**
     * Returns all confirmed observations to create new commitments
     */
    allReadyObservations = async (): Promise<Array<ObservationEntity>> => {
        const height = await ErgoNetwork.getHeight()
        const observations = (await this.networkDataBase.getConfirmedObservations(this.observationConfirmation, height))
            .filter(observation => observation.status == TxStatus.NOT_COMMITTED)
        return Promise.all(observations.map(async observation => await this.isObservationValid(observation)))
            .then(result => observations.filter((_v, index) => result[index]))
    }

    /**
     * Returns sets of commitments that are ready to be merged into event trigger
     */
    allReadyCommitmentSets = async (): Promise<Array<CommitmentSet>> => {
        const readyCommitments: Array<CommitmentSet> = []
        const height = await ErgoNetwork.getHeight()
        const observations = (await this.networkDataBase.getConfirmedObservations(this.observationConfirmation, height))
            .filter(observation => observation.status == TxStatus.COMMITTED)
        for(const observation of observations){
            const relatedCommitments = await this.bridgeDataBase.commitmentsByEventId(observation.requestId)
            if(!(await this.isMergeHappened(observation)))
                readyCommitments.push({
                    commitments: relatedCommitments.filter(commitment => commitment.spendBlockHash === undefined),
                    observation: observation
                })
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
