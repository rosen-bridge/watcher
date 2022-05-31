import { CommitmentDataBase } from "../commitments/models/commitmentModel";
import { Observation } from "../objects/interfaces";
import { NetworkDataBase } from "../models/networkModel";
import { ErgoBox } from "ergo-lib-wasm-nodejs";
import { ErgoNetworkApi } from "../ergoUtils/networkApi";
import { CommitmentEntity } from "../entities/CommitmentEntity";
import config from "config";
import { ObservedCommitmentEntity } from "../entities/ObservedCommitmentEntity";

const commitmentLimit = parseInt(config.get?.('commitmentLimit'))
export class commitmentReveal{
    _commitmentDataBase: CommitmentDataBase
    _observationDataBase: NetworkDataBase

    triggerEventCreationTx = async (commitmentBoxes: Array<ErgoBox>, observation: Observation): Promise<string> => {
        const height = await ErgoNetworkApi.getCurrentHeight()

        return ""
    }

    commitmentCheck = async (commitments: Array<ObservedCommitmentEntity>, observation: Observation): Promise<Boolean> => {
        return true
    }

    job = async () => {
        const createdCommitments = await this._observationDataBase.getCreatedCommitments()
        for (const commitment of createdCommitments) {
            const observedCommitments = await this._commitmentDataBase.commitmentsByEventId(commitment.eventId)
            if(observedCommitments.length >= commitmentLimit) {
                if(await this.commitmentCheck(observedCommitments, commitment.observation)){
                    const commitmentBoxes = observedCommitments.map(async(commitment) => {
                        return await ErgoNetworkApi.boxById(commitment.commitmentBoxId)
                    })
                    Promise.all(commitmentBoxes).then(boxes => {
                        this.triggerEventCreationTx(boxes, commitment.observation)
                    })
                }
            }
        }
    }
}
