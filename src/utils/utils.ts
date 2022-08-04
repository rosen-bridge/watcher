import * as ergoLib from "ergo-lib-wasm-nodejs";
import { ErgoConfig } from "../config/config";

export const hexStrToUint8Array = (str: string): Uint8Array => {
    return new Uint8Array(Buffer.from(str, "hex"))
}

export const uint8ArrayToHex = (buffer: Uint8Array): string => {
    return Buffer.from(buffer).toString('hex');
}

export function bigIntToUint8Array(num: bigint) {
    const b = new ArrayBuffer(8)
    new DataView(b).setBigUint64(0, num);
    return new Uint8Array(b);
}

export const base64ToArrayBuffer = (base64: string): Uint8Array => {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
};

export function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

export const generateSK = (ergoConfig: ErgoConfig): { address: string, secret: string} => {
    const secretKey= ergoLib.SecretKey.random_dlog();
    return {
        address: secretKey.get_address().to_base58(ergoConfig.networkType),
        secret: uint8ArrayToHex(secretKey.to_bytes())
    };
}
