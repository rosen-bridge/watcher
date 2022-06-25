import { BridgeDataBase } from "../bridge/models/bridgeModel";
import { NetworkDataBase } from "../models/networkModel";
import { CommitmentSet, Observation } from "../objects/interfaces";
import { ObservedCommitmentEntity, SpendReason } from "../entities/ObservedCommitmentEntity";
import { ObservationEntity } from "../entities/ObservationEntity";


export class databaseConnection{
    __bridgeDataBase: BridgeDataBase
    __networkDataBase: NetworkDataBase
    __observationConfirmation: number

    constructor(networkDb: NetworkDataBase, bridgeDb: BridgeDataBase, confirmation: number) {
        this.__networkDataBase = networkDb
        this.__bridgeDataBase = bridgeDb
        this.__observationConfirmation = confirmation
    }

    /**
     * Check if a commitment is created form the observation or not
     * @param observation
     */
    private isCommitmentCreated = async (observation: Observation): Promise<Boolean> => {
        if(observation.commitmentBoxId === undefined){
            return false
        }
        const commitment = await this.__bridgeDataBase.findCommitmentsById([observation.commitmentBoxId])
        return commitment.length > 0;
    }

    /**
     * returns true if any commitment boxes had been spent to create event trigger
     * @param commitments
     */
    private isMergeHappened = (commitments: Array<ObservedCommitmentEntity>): Boolean => {
        commitments.forEach(commitment => {
            if(commitment.spendReason! === SpendReason.MERGE) return true
        })
        return false
    }

    /**
     * Returns all confirmed observations to create new commitments
     */
    allReadyObservations = async (): Promise<Array<ObservationEntity>> => {
        const observations = await this.__networkDataBase.getConfirmedObservations(this.__observationConfirmation)
        return observations.filter(observation => !this.isCommitmentCreated(observation))
    }

    /**
     * Returns sets of commitments that are ready to be merged into event trigger
     */
    allReadyCommitmentSets = async (): Promise<Array<CommitmentSet>> => {
        let readyCommitments: Array<CommitmentSet> = []
        const observations = (await this.__networkDataBase.getConfirmedObservations(this.__observationConfirmation))
            .filter(observation => this.isCommitmentCreated(observation))
        for(const observation of observations){
            const relatedCommitments = await this.__bridgeDataBase.commitmentsByEventId(observation.requestId)
            if(!this.isMergeHappened(relatedCommitments))
                readyCommitments.push({
                    commitments: relatedCommitments,
                    observation: observation
                })
        }
        return readyCommitments
    }

    /**
     * Updates the observation after commitment creation
     * @param commitmentBoxId
     * @param observation
     */
    updateObservation = async (commitmentBoxId: string, observation: ObservationEntity) => {
        await this.__networkDataBase.updateObservation(commitmentBoxId, observation)
    }
}