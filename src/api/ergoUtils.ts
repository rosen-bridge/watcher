import * as ergoLib from "ergo-lib-wasm-nodejs";

export const ergoTreeToAddress = (ergoTree: ergoLib.ErgoTree): ergoLib.Address => {
    return ergoLib.Address.recreate_from_ergo_tree(ergoTree)
}

export const ergoTreeToBase58Address = (
    ergoTree: ergoLib.ErgoTree,
    networkType: number = ergoLib.NetworkPrefix.Mainnet
): string => {
    return ergoTreeToAddress(ergoTree).to_base58(networkType)
}
