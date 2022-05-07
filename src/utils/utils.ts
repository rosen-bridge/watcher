import * as wasm from "ergo-lib-wasm-nodejs";
import {ErgoBox} from "ergo-lib-wasm-nodejs";
import config from "config";

const networkType: wasm.NetworkPrefix = config.get?.('ergo.networkType');

export function notEmpty<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

export const extractBoxes = (tx: wasm.Transaction): Array<ErgoBox> => {
    return Array(tx.outputs().len()).fill("")
        .map((item, index) => tx.outputs().get(index))
}

export const ergoTreeToAddress = (ergoTree: wasm.ErgoTree): wasm.Address => {
    return wasm.Address.recreate_from_ergo_tree(ergoTree)
}

export const ergoTreeToBase58Address = (ergoTree: wasm.ErgoTree): string => {
    return ergoTreeToAddress(ergoTree).to_base58(networkType)
}
