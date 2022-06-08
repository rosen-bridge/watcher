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

    /**
     * creates and sends the trigger event transaction
     * @param commitmentBoxes
     * @param observation
     * @param WIDs
     * @param feeBox
     */
    triggerEventCreationTx = async (commitmentBoxes: Array<ErgoBox>, observation: Observation, WIDs: Array<Uint8Array>, feeBox: ErgoBox): Promise<string> => {
        const height = await ErgoNetworkApi.getCurrentHeight()
        const boxValues = commitmentBoxes.map(box => BigInt(box.value().as_i64().to_str())).reduce((a, b) =>  a + b, BigInt(0))
        const triggerEvent = await boxes.createTriggerEvent(BigInt(boxValues), height, WIDs, observation)
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

    /**
     * Returns the valid commitments with the observation
     * It reproduces the commitments with their WID and check to match the saved commitment
     * @param commitments
     * @param observation
     */
    commitmentCheck = (commitments: Array<ObservedCommitmentEntity>, observation: Observation): Array<ObservedCommitmentEntity> => {
        return commitments.filter(commitment => {
            return commitmentFromObservation(observation, commitment.WID).toString() === commitment.commitment
        })
    }

    /**
     * Gets the created commitments and check if required number of commitments created in the network
     * If the number of valid commitments are more than the required commitments it generates the trigger event
     */
    job = async () => {
        const createdCommitments = await this._observationDataBase.getCreatedCommitments()
        for (const commitment of createdCommitments) {
            const observedCommitments = await this._commitmentDataBase.commitmentsByEventId(commitment.eventId)
            if(observedCommitments.length >= commitmentLimit) {
                const validCommitments = this.commitmentCheck(observedCommitments, commitment.observation)
                if(validCommitments.length >= commitmentLimit){
                    const commitmentBoxes = validCommitments.map(async(commitment) => {
                        return await ErgoNetworkApi.boxById(commitment.commitmentBoxId)
                    })
                    Promise.all(commitmentBoxes).then(async(cBoxes) => {
                        const WIDs: Array<Uint8Array> = observedCommitments.map(commitment => {
                            return Buffer.from(commitment.WID)
                        })
                        await this.triggerEventCreationTx(cBoxes, commitment.observation, WIDs, await boxes.getUserPaymentBox(txFee))
                    })
                }
            }
        }
    }
}
