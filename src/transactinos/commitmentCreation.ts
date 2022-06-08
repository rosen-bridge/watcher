import * as wasm from "ergo-lib-wasm-nodejs";
import { ErgoNetworkApi } from "../ergoUtils/networkApi";
import { boxes } from "../ergoUtils/boxes";
import { commitmentFromObservation, contractHash, createAndSignTx } from "../ergoUtils/ergoUtils";
import { NetworkDataBase } from "../models/networkModel";
import { boxCreationError } from "../utils/utils";
import { ObservationEntity } from "../entities/ObservationEntity";
import { rosenConfig } from "../api/rosenConfig";
import { ErgoConfig } from "../config/config";

const minBoxVal = parseInt(rosenConfig.minBoxValue)
const txFee = parseInt(rosenConfig.fee)
const ergoConfig = ErgoConfig.getConfig();
//TODO:hard coded should implemented later
const WID: string = "906d389a39c914a393cb06c0ab7557d04b58f7e9e73284aac520d08e7dd46a82"

export class commitmentCreation{
    _dataBase: NetworkDataBase
    _requiredConfirmation: number

    constructor(db: NetworkDataBase, confirmation: number) {
        this._dataBase = db
        this._requiredConfirmation = confirmation
    }

    /**
     * creates the commitment transaction and sends it to the network
     * @param WID
     * @param requestId
     * @param eventDigest
     * @param permits
     * @param WIDBox
     */
    createCommitmentTx = async (WID: string,
                                requestId: string,
                                eventDigest: Uint8Array,
                                permits: Array<wasm.ErgoBox>,
                                WIDBox: Array<wasm.ErgoBox>): Promise<string> => {
        const height = await ErgoNetworkApi.getCurrentHeight()
        const permitHash = contractHash(
            wasm.Contract.pay_to_address(
                wasm.Address.from_base58(
                    rosenConfig.watcherPermitAddress
                )
            )
        )
        const outCommitment = boxes.createCommitment(BigInt(minBoxVal), height, WID, requestId, eventDigest, permitHash)
        const RWTCount: bigint = permits.map(permit =>
            BigInt(permit.tokens().get(0).amount().as_i64().to_str()))
            .reduce((a, b) => a + b, BigInt(0))
        if (RWTCount <= 1) {
            // TODO: Fix this problem
            console.log("Not enough RWT tokens to create a new commitment")
            return ""
        }
        const outPermit = boxes.createPermit(BigInt(minBoxVal), height, RWTCount - BigInt(1), WID)
        const inputBoxes = new wasm.ErgoBoxes(permits[0]);
        WIDBox.forEach(box => inputBoxes.add(box))
        permits.slice(1).forEach(permit => inputBoxes.add(permit))
        const s: string = ergoConfig.secretKey;
        const secret = wasm.SecretKey.dlog_from_bytes(Buffer.from(s, "hex"))
        try {
            const signed = await createAndSignTx(
                secret,
                inputBoxes,
                [outPermit, outCommitment],
                height
            )
            await ErgoNetworkApi.sendTx(signed.to_json())
            return signed.id().to_str()
        } catch (e) {
            console.log(e)
            if (e instanceof boxCreationError) {
                console.log("Transaction input and output doesn't match. Input boxes assets must be more or equal to the outputs assets.")
            }
            console.log("Skipping the commitment creation.")
            return ""
        }
    }

    /**
     * Extracts the confirmed observations and creates the commitment transaction
     * Finally saves the created commitment in the database
     */
    job = async () => {
        const observations: Array<ObservationEntity> = await this._dataBase.getConfirmedObservations(this._requiredConfirmation)
        for (const observation of observations) {
            const commitment = commitmentFromObservation(observation, WID)
            const permits = await boxes.getPermits(WID)
            const WIDBox = await boxes.getWIDBox(WID)
            const txId = await this.createCommitmentTx(WID, observation.requestId, commitment, permits, WIDBox)
            await this._dataBase.saveCommitment({
                eventId: observation.requestId,
                commitment: commitment.toString(),
                commitmentBoxId: "",
                WID: WID
            }, txId, observation.id)
        }
    }
}
