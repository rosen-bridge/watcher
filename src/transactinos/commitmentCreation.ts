import * as wasm from "ergo-lib-wasm-nodejs";
import {contracts} from "../contracts/contracts";
import {ErgoNetworkApi} from "../ergoUtils/networkApi";
import config from "config";
import {boxes} from "../ergoUtils/boxes";
import {blake2b} from "ethereum-cryptography/blake2b";
import {createAndSignTx, extractTokens} from "../ergoUtils/utils";

const minBoxVal = parseInt(config.get?.('ergo.minBoxVal'))
const txFee = parseInt(config.get?.('ergo.txFee'))

const createCommitmentTx = async (WID: string, requestId: string, eventDigest: string, permits: Array<wasm.ErgoBox>, WIDBox: wasm.ErgoBox): Promise<string> => {
    const height = await ErgoNetworkApi.getCurrentHeight()
    const permitHash = blake2b(Buffer.from(contracts.addressCache.permitContract!.ergo_tree().to_base16_bytes(), "hex"), 32)
    const outCommitment = boxes.createCommitment(minBoxVal, height, WID, requestId, eventDigest, permitHash)
    const RWTCount: number = permits.map(permit => permit.tokens().get(0).amount().as_i64().as_num()).reduce((a, b) => a + b, 0)
    const outPermit = boxes.createPermit(minBoxVal, height, RWTCount - 1, WID)
    const paymentValue = permits.map(permit => permit.value().as_i64().as_num()).reduce((a, b) => a + b, 0)
    // const paymentTokens: Array<wasm.Token> = permits.map(permit => extractTokens(permit.tokens())).
    const watcherPayment = boxes.createPayment(paymentValue - txFee - 2*minBoxVal, height, [])
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
