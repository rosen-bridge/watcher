import * as wasm from "ergo-lib-wasm-nodejs";
import {blake2b} from "blakejs";

/**
 * Produces the contract hash
 * @param contract
 */
export const contractHash = (contract: wasm.Contract): Buffer => {
    return Buffer.from(
        blake2b(Buffer.from(contract.ergo_tree().to_base16_bytes(), "hex"), undefined, 32)
    )
}
