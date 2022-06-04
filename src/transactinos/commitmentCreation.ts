import * as wasm from "ergo-lib-wasm-nodejs";
import { contracts } from "../contracts/contracts";
import { ErgoNetworkApi } from "../ergoUtils/networkApi";
import config from "config";
import { boxes } from "../ergoUtils/boxes";
import { commitmentFromObservation, contractHash, createAndSignTx } from "../ergoUtils/ergoUtils";
import { NetworkDataBase } from "../models/networkModel";
import { boxCreationError } from "../utils/utils";
import { ObservationEntity } from "../entities/ObservationEntity";

const minBoxVal = parseInt(config.get?.('ergo.minBoxVal'))
const txFee = parseInt(config.get?.('ergo.txFee'))
const WID: string = config.get('ergo.WID')

export class commitmentCreation {
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
        const permitHash = contractHash(contracts.addressCache.permitContract!)
        const outCommitment = boxes.createCommitment(BigInt(minBoxVal), height, WID, requestId, eventDigest, permitHash)
        const RWTCount: number = permits.map(permit =>
            permit.tokens().get(0).amount().as_i64().as_num())
            .reduce((a, b) => a + b, 0)
        if(RWTCount <= 1){
            // TODO: Fix this problem
            console.log("Not enough RWT tokens to create a new commitment")
            return ""
        }
        const outPermit = boxes.createPermit(BigInt(minBoxVal), height, RWTCount - 1, WID)
        const inputBoxes = new wasm.ErgoBoxes(permits[0]);
        WIDBox.forEach(box => inputBoxes.add(box))
        permits.slice(1).forEach(permit => inputBoxes.add(permit))
        const s: string = config.get?.("ergo.secret")
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
