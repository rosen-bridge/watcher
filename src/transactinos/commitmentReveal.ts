import { CommitmentDataBase } from "../commitments/models/commitmentModel";
import { Observation } from "../objects/interfaces";
import { NetworkDataBase } from "../models/networkModel";
import { ErgoBox } from "ergo-lib-wasm-nodejs";
import { ErgoNetworkApi } from "../ergoUtils/networkApi";
import config from "config";
import { ObservedCommitmentEntity } from "../entities/ObservedCommitmentEntity";
import { commitmentFromObservation, createAndSignTx } from "../ergoUtils/ergoUtils";
import { boxes } from "../ergoUtils/boxes";
import { Buffer } from "buffer";
import * as wasm from "ergo-lib-wasm-nodejs";
import { boxCreationError } from "../utils/utils";

const commitmentLimit = parseInt(config.get?.('commitmentLimit'))
const minBoxValue = parseInt(config.get?.('ergo.minBoxVal'))
const txFee = parseInt(config.get?.('ergo.txFee'))

export class commitmentReveal{
    _commitmentDataBase: CommitmentDataBase
    _observationDataBase: NetworkDataBase

    triggerEventCreationTx = async (commitmentBoxes: Array<ErgoBox>, observation: Observation, WIDs: Array<Uint8Array>, feeBox: ErgoBox): Promise<string> => {
        const height = await ErgoNetworkApi.getCurrentHeight()
        const triggerEvent = await boxes.createTriggerEvent(commitmentBoxes.length* minBoxValue, height, WIDs, observation)
        const inputBoxes = new wasm.ErgoBoxes(feeBox);
        commitmentBoxes.forEach(box => inputBoxes.add(box))
        try {
            const signed = await createAndSignTx(
                config.get("ergo.secret"),
                inputBoxes,
                [triggerEvent],
                height
            )
            await ErgoNetworkApi.sendTx(signed.to_json())
            return signed.id().to_str()
        } catch (e) {
            if (e instanceof boxCreationError) {
                console.log("Transaction input and output doesn't match. Input boxes assets must be more or equal to the outputs assets.")
            }
            console.log("Skipping the event trigger creation.")
            return ""
        }
    }

    commitmentCheck = async (commitments: Array<ObservedCommitmentEntity>, observation: Observation, eventDigest: string): Promise<Boolean> => {
        commitments.forEach(commitment => {
                if (commitmentFromObservation(observation, commitment.WID).toString() != eventDigest) return false
            }
        )
        return true
    }

    job = async () => {
        const createdCommitments = await this._observationDataBase.getCreatedCommitments()
        for (const commitment of createdCommitments) {
            const observedCommitments = await this._commitmentDataBase.commitmentsByEventId(commitment.eventId)
            if(observedCommitments.length >= commitmentLimit) {
                if(await this.commitmentCheck(observedCommitments, commitment.observation, commitment.commitment)){
                    const commitmentBoxes = observedCommitments.map(async(commitment) => {
                        return await ErgoNetworkApi.boxById(commitment.commitmentBoxId)
                    })
                    Promise.all(commitmentBoxes).then(async(cBoxes) => {
                        const WIDs: Array<Uint8Array> = observedCommitments.map(commitment => {
                            return Buffer.from(commitment.WID)
                        })
                        await this.triggerEventCreationTx(cBoxes, commitment.observation, WIDs, await boxes.getFeeBox(txFee))
                    })
                }
            }
        }
    }
}
