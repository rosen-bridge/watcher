import * as wasm from "ergo-lib-wasm-nodejs";
import { ErgoConfig } from "../config/config";

export class boxCreationError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = "BoxCreationError"
    }
}
export class NotEnoughFund extends Error {
    constructor(message?: string) {
        super(message)
        this.name = "NotEnoughFund"
    }
}

export function notEmpty<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

export const strToUint8Array = (str: string): Uint8Array => {
    return new Uint8Array(Buffer.from(str, "hex"))
}

export const uint8ArrayToHex = (buffer: Uint8Array): string => {
    return Buffer.from(buffer).toString('hex');
}

export const extractBoxes = (tx: wasm.Transaction): Array<wasm.ErgoBox> => {
    return Array(tx.outputs().len()).fill("")
        .map((item, index) => tx.outputs().get(index))
}

export const ergoTreeToAddress = (ergoTree: wasm.ErgoTree): wasm.Address => {
    return wasm.Address.recreate_from_ergo_tree(ergoTree)
}


export const decodeCollColl = async (str: string): Promise<Uint8Array[]> => {
    return wasm.Constant.decode_from_base16(str).to_coll_coll_byte()
}

export function bigIntToUint8Array(num: bigint) {
    const b = new ArrayBuffer(8)
    new DataView(b).setBigUint64(0, num);
    return new Uint8Array(b);
}


export const decodeStr = async (str: string): Promise<string> => {
    return Buffer.from(wasm.Constant.decode_from_base16(str).to_byte_array()).toString('hex')
}
