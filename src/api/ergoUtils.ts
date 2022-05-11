import * as ergoLib from "ergo-lib-wasm-nodejs";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";


const signTx = async (secret: ergoLib.SecretKey, tx: ergoLib.UnsignedTransaction, boxSelection: ergoLib.BoxSelection, dataInputs: ergoLib.ErgoBoxes) => {
    const secrets = new ergoLib.SecretKeys()
    secrets.add(secret)
    const wallet = ergoLib.Wallet.from_secrets(secrets);
    const ctx = await ApiNetwork.getErgoStateContext();
    return wallet.sign_transaction(ctx, tx, boxSelection.boxes(), dataInputs)
}
