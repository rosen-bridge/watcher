import { Commitment, Observation } from "../objects/interfaces";
import { ErgoUtils } from "../ergo/utils";
import { Boxes } from "../ergo/boxes";
import { Buffer } from "buffer";
import * as wasm from "ergo-lib-wasm-nodejs";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import { boxCreationError } from "../errors/errors";
import { databaseConnection } from "../ergo/databaseConnection";
import { rosenConfig } from "../config/rosenConfig";

const txFee = BigInt(rosenConfig.fee)

export class commitmentReveal{
    _databaseConnection: databaseConnection
    _secret: wasm.SecretKey
    _boxes: Boxes

    constructor(secret: wasm.SecretKey, boxes: Boxes, db: databaseConnection) {
        this._secret = secret
        this._boxes = boxes
        this._databaseConnection = db
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
        const triggerEvent = await this._boxes.createTriggerEvent(BigInt(boxValues), height, WIDs, observation)
        const inputBoxes = new wasm.ErgoBoxes(feeBoxes[0]);
        feeBoxes.slice(1, feeBoxes.length).forEach(box => inputBoxes.add(box))
        commitmentBoxes.forEach(box => inputBoxes.add(box))
        try {
            const signed = await ErgoUtils.createAndSignTx(
                this._secret,
                inputBoxes,
                [triggerEvent],
                height
            )
            await ErgoNetwork.sendTx(signed.to_json())
            return signed.id().to_str()
        } catch (e) {
            if (e instanceof boxCreationError) {
                console.log("Transaction input and output doesn't match. Input boxesSample assets must be more or equal to the outputs assets.")
            }
            console.log("Skipping the event trigger creation.")
            return ""
        }
    }

    /**
     * Returns the valid bridge with the observation
     * It reproduces the bridge with their WID and check to match the saved commitment
     * @param commitments
     * @param observation
     */
    commitmentCheck = (commitments: Array<Commitment>, observation: Observation): Array<Commitment> => {
        return commitments.filter(commitment => {
            return ErgoUtils.commitmentFromObservation(observation, commitment.WID).toString() === commitment.commitment
        })
    }

    /**
     * Gets the created bridge and check if required number of bridge created in the network
     * If the number of valid bridge are more than the required bridge it generates the trigger event
     */
    job = async () => {
        const commitmentSets = await this._databaseConnection.allReadyCommitmentSets()
        for (const commitmentSet of commitmentSets) {
            const validCommitments = this.commitmentCheck(commitmentSet.commitments, commitmentSet.observation)
            const requiredCommitments = await ErgoUtils.requiredCommitmentCount(this._boxes)
            if(BigInt(validCommitments.length) >= requiredCommitments){
                const commitmentBoxes = validCommitments.map(async(commitment) => {
                    return await ErgoNetwork.boxById(commitment.commitmentBoxId)
                })
                await Promise.all(commitmentBoxes).then(async(cBoxes) => {
                    const WIDs: Array<Uint8Array> = validCommitments.map(commitment => {
                        return Buffer.from(commitment.WID)
                    })
                    await this.triggerEventCreationTx(cBoxes, commitmentSet.observation, WIDs, await this._boxes.getUserPaymentBox(txFee))
                })
            }
        }
    }
}
