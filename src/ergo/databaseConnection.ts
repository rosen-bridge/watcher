import { BridgeDataBase } from "../bridge/models/bridgeModel";
import { NetworkDataBase } from "../models/networkModel";
import { CommitmentSet } from "../objects/interfaces";
import { SpendReason } from "../entities/watcher/bridge/ObservedCommitmentEntity";
import { ObservationEntity, TxStatus } from "../entities/watcher/network/ObservationEntity";
import { ErgoNetwork } from "./network/ergoNetwork";
import { ErgoConfig } from "../config/config";

const ergoConfig = ErgoConfig.getConfig();


export class databaseConnection{
    __bridgeDataBase: BridgeDataBase
    __networkDataBase: NetworkDataBase
    __observationConfirmation: number
    __observationValidThreshold: number

    constructor(networkDb: NetworkDataBase, bridgeDb: BridgeDataBase, confirmation: number, validThreshold: number) {
        this.__networkDataBase = networkDb
        this.__bridgeDataBase = bridgeDb
        this.__observationConfirmation = confirmation
        this.__observationValidThreshold = validThreshold
    }

    /**
     * Checks if the observation is valid for commitment creation
     * @param observation
     */
    isObservationValid = async (observation: ObservationEntity): Promise<boolean> => {
        if(observation.status == TxStatus.TIMED_OUT) return false
        const currentHeight = await ErgoNetwork.getHeight()
        if(currentHeight - observation.block.height > this.__observationValidThreshold) {
            await this.__networkDataBase.updateObservationTxStatus(observation, TxStatus.TIMED_OUT)
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
        const commitments = await this.__bridgeDataBase.commitmentsByEventId(observation.requestId)
        for(const commitment of commitments){
            if(commitment.spendBlock && commitment.spendReason && commitment.spendReason === SpendReason.MERGE) {
                const height = await ErgoNetwork.getHeight()
                if(height - commitment.spendBlock.height > ergoConfig.transactionConfirmation)
                    await this.__networkDataBase.updateObservationTxStatus(observation, TxStatus.REVEALED)
                return true
            }
        }
        return false
    }

    /**
     * Returns all confirmed observations to create new commitments
     */
    allReadyObservations = async (): Promise<Array<ObservationEntity>> => {
        const observations = (await this.__networkDataBase.getConfirmedObservations(this.__observationConfirmation))
            .filter(observation => observation.status == TxStatus.NOT_COMMITTED)
        return Promise.all(observations.map(async observation => await this.isObservationValid(observation)))
            .then(result => observations.filter((_v, index) => result[index]))
    }

    /**
     * Returns sets of commitments that are ready to be merged into event trigger
     */
    allReadyCommitmentSets = async (): Promise<Array<CommitmentSet>> => {
        const readyCommitments: Array<CommitmentSet> = []
        const observations = (await this.__networkDataBase.getConfirmedObservations(this.__observationConfirmation))
            .filter(observation => observation.status == TxStatus.COMMITTED)
        for(const observation of observations){
            const relatedCommitments = await this.__bridgeDataBase.commitmentsByEventId(observation.requestId)
            if(!(await this.isMergeHappened(observation)))
                readyCommitments.push({
                    commitments: relatedCommitments.filter(commitment => commitment.spendBlock === undefined),
                    observation: observation
                })
        }
        return readyCommitments
    }
}
