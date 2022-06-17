import { CommitmentDataBase } from "../commitments/models/commitmentModel";
import { Observation } from "../objects/interfaces";
import { NetworkDataBase } from "../models/networkModel";
import config from "config";
import { ObservedCommitmentEntity } from "../entities/ObservedCommitmentEntity";
import { commitmentFromObservation, createAndSignTx } from "../ergo/utils";
import { Boxes } from "../ergo/boxes";
import { Buffer } from "buffer";
import * as wasm from "ergo-lib-wasm-nodejs";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { boxCreationError } from "../errors/errors";

const commitmentLimit = parseInt(config.get?.('commitmentLimit'))
const txFee = parseInt(config.get?.('ergo.txFee'))

export class commitmentReveal{
    _commitmentDataBase: CommitmentDataBase
    _observationDataBase: NetworkDataBase
    _secret: wasm.SecretKey
    _boxes: Boxes

    constructor(secret: wasm.SecretKey, boxes: Boxes) {
        this._secret = secret
        this._boxes = boxes
    }
    /**
     * creates and sends the trigger event transaction
     * @param commitmentBoxes
     * @param observation
     * @param WIDs
     * @param feeBoxes
     */
    triggerEventCreationTx = async (commitmentBoxes: Array<wasm.ErgoBox>,
                                    observation: Observation,
                                    WIDs: Array<Uint8Array>,
                                    feeBoxes: Array<wasm.ErgoBox>): Promise<string> => {
        const height = await ErgoNetwork.getHeight()
        const boxValues = commitmentBoxes.map(box => BigInt(box.value().as_i64().to_str())).reduce((a, b) =>  a + b, BigInt(0))
        const triggerEvent = await Boxes.createTriggerEvent(BigInt(boxValues), height, WIDs, observation)
        const inputBoxes = new wasm.ErgoBoxes(feeBoxes[0]);
        feeBoxes.slice(1, feeBoxes.length).forEach(box => inputBoxes.add(box))
        commitmentBoxes.forEach(box => inputBoxes.add(box))
        try {
            const signed = await createAndSignTx(
                this._secret,
                inputBoxes,
                [triggerEvent],
                height
            )
            await ErgoNetwork.sendTx(signed.to_json())
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
                        return await ErgoNetwork.boxById(commitment.commitmentBoxId)
                    })
                    Promise.all(commitmentBoxes).then(async(cBoxes) => {
                        const WIDs: Array<Uint8Array> = observedCommitments.map(commitment => {
                            return Buffer.from(commitment.WID)
                        })
                        await this.triggerEventCreationTx(cBoxes, commitment.observation, WIDs, await this._boxes.getUserPaymentBox(txFee))
                    })
                }
            }
        }
    }
}
