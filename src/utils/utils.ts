import * as ergoLib from "ergo-lib-wasm-nodejs";
import { Config } from "../config/config";

/**
 * returns the decoded input hex string
 * @param str
 */
export const hexStrToUint8Array = (str: string): Uint8Array => {
    return new Uint8Array(Buffer.from(str, "hex"))
}

/**
 * Encodes the uint array to the hex string
 * @param buffer
 */
export const uint8ArrayToHex = (buffer: Uint8Array): string => {
    return Buffer.from(buffer).toString('hex');
}

/**
 * returns the decoded bigint input
 * @param num
 */
export function bigIntToUint8Array(num: bigint) {
    const b = new ArrayBuffer(8)
    new DataView(b).setBigUint64(0, num);
    return new Uint8Array(b);
}

/**
 * returns the decoded base64 input string
 * @param base64
 */
export const base64ToArrayBuffer = (base64: string): Uint8Array => {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
};

/**
 * create delay in process running
 * @param time
 */
export function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * returns a random secret key along with its associate address
 * @param config
 */
export const generateSK = (config: Config): { address: string, secret: string} => {
    const secretKey= ergoLib.SecretKey.random_dlog();
    return {
        address: secretKey.get_address().to_base58(config.networkType),
        secret: uint8ArrayToHex(secretKey.to_bytes())
    };
}
