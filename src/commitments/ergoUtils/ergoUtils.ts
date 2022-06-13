import * as wasm from "ergo-lib-wasm-nodejs";

let blake2b = require('blake2b')

/**
 * Produces the contract hash
 * @param contract
 */
export const contractHash = (contract: wasm.Contract): Buffer => {
    return Buffer.from(
        blake2b(32)
            .update(Buffer.from(contract.ergo_tree().to_base16_bytes(), "hex"))
            .digest()
    )
}
