import { BridgeDataBase } from "../bridge/models/bridgeModel";
import { NetworkDataBase } from "../models/networkModel";
import { CommitmentSet, Observation } from "../objects/interfaces";
import { ObservedCommitmentEntity, SpendReason } from "../entities/watcher/bridge/ObservedCommitmentEntity";
import { ObservationEntity } from "../entities/watcher/network/ObservationEntity";


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
    private isCommitmentCreated = async (observation: Observation): Promise<boolean> => {
        if(observation.commitmentBoxId === undefined){
            return false
        }
        const commitment = await this.__bridgeDataBase.findCommitmentsById([observation.commitmentBoxId])
        return commitment.length > 0;
    }

    /**
     * returns true if any commitment boxesSample had been spent to create event trigger
     * @param commitments
     */
    private isMergeHappened = (commitments: Array<ObservedCommitmentEntity>): boolean => {
        for(const commitment of commitments){
            if(commitment.spendReason && commitment.spendReason === SpendReason.MERGE) return true
        }
        return false
    }

    /**
     * Returns all confirmed observations to create new commitments
     */
    allReadyObservations = async (): Promise<Array<ObservationEntity>> => {
        const observations = await this.__networkDataBase.getConfirmedObservations(this.__observationConfirmation)
        return Promise.all(observations.map(async observation => !(await this.isCommitmentCreated(observation))))
            .then(result => observations.filter((_v, index) => result[index]))
    }

    /**
     * Returns sets of commitments that are ready to be merged into event trigger
     */
    allReadyCommitmentSets = async (): Promise<Array<CommitmentSet>> => {
        const readyCommitments: Array<CommitmentSet> = []
        const observationEntities = (await this.__networkDataBase.getConfirmedObservations(this.__observationConfirmation))
        const observations: Array<Observation> = await Promise.all(
            observationEntities.map(async observation => await this.isCommitmentCreated(observation)))
            .then(result => observationEntities.filter((_v, index) => result[index]))
        for(const observation of observations){
            const relatedCommitments = await this.__bridgeDataBase.commitmentsByEventId(observation.requestId)
            if(!this.isMergeHappened(relatedCommitments))
                readyCommitments.push({
                    commitments: relatedCommitments.filter(commitment => commitment.spendBlock === undefined),
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
