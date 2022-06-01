import * as wasm from "ergo-lib-wasm-nodejs";
import { SecretKey } from "ergo-lib-wasm-nodejs";

export const ergoTreeToAddress = (ergoTree: wasm.ErgoTree): wasm.Address => {
    return wasm.Address.recreate_from_ergo_tree(ergoTree)
}

export const ergoTreeToBase58Address = (
    ergoTree: wasm.ErgoTree,
    networkType: wasm.NetworkPrefix = wasm.NetworkPrefix.Mainnet
): string => {
    return ergoTreeToAddress(ergoTree).to_base58(networkType.valueOf())
}

export const generateSK = (): SecretKey => {
    return wasm.SecretKey.random_dlog();
}
