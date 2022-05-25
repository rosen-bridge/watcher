import * as wasm from "ergo-lib-wasm-nodejs";
import {contracts} from "../contracts/contracts";
import {ErgoNetworkApi} from "../ergoUtils/networkApi";
import config from "config";
import {boxes} from "../ergoUtils/boxes";
import {blake2b} from "ethereum-cryptography/blake2b";
import {commitmentFromObservation, createAndSignTx, extractTokens} from "../ergoUtils/utils";
import {NetworkDataBase} from "../models/networkModel";
import {Buffer} from "buffer";

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

    createCommitmentTx = async (WID: string, requestId: string, eventDigest: Uint8Array, permits: Array<wasm.ErgoBox>, WIDBox: wasm.ErgoBox): Promise<string> => {
        const height = await ErgoNetworkApi.getCurrentHeight()
        const permitHash = blake2b(Buffer.from(contracts.addressCache.permitContract!.ergo_tree().to_base16_bytes(), "hex"), 32)
        const outCommitment = boxes.createCommitment(minBoxVal, height, WID, requestId, eventDigest, permitHash)
        const RWTCount: number = permits.map(permit => permit.tokens().get(0).amount().as_i64().as_num()).reduce((a, b) => a + b, 0)
        const outPermit = boxes.createPermit(minBoxVal, height, RWTCount - 1, WID)
        const paymentValue = permits.map(permit => permit.value().as_i64().as_num()).reduce((a, b) => a + b, 0)
        // TODO: Complete Watcher Payment (Token rewards)
        // Don't forget to consider WIDBox assets
        // const paymentTokens: Array<wasm.Token> = permits.map(permit => extractTokens(permit.tokens())).
        const watcherPayment = boxes.createPayment(WIDBox.value().as_i64().as_num() + paymentValue - txFee - 2 * minBoxVal, height, [])
        const inputBoxes = new wasm.ErgoBoxes(WIDBox);
        permits.forEach(permit => inputBoxes.add(permit))
        const signed = await createAndSignTx(
            config.get("ergo.secret"),
            inputBoxes,
            [outPermit, outCommitment, watcherPayment],
            height
        )
        await ErgoNetworkApi.sendTx(signed.to_json())
        return signed.id().to_str()
    }

    job = async () => {
        const observations = await this._dataBase.getConfirmedObservations(this._requiredConfirmation)
        for(const observation of observations){
            const commitment = commitmentFromObservation(observation, WID)
            const permits = await boxes.getPermits(WID)
            const WIDBox = await boxes.getWIDBox(WID)
            const txId = await this.createCommitmentTx(WID, observation.requestId, commitment, permits, WIDBox[0])
            await this._dataBase.saveCommitment({
                eventId: observation.requestId,
                commitment: commitment.toString(),
                commitmentBoxId: "",
                WID: WID
            }, txId, observation.id)
        }
    }
}
