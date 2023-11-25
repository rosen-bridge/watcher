import { blake2b } from 'blakejs';
import * as ergoLib from 'ergo-lib-wasm-nodejs';

/**
 * calculates scriptHash for passed Address
 *
 * @param {string} address
 * @return {string}
 */
export const toScriptHash = (address: string): string => {
  const scriptHash = Buffer.from(
    blake2b(
      Buffer.from(
        ergoLib.Address.from_base58(address).to_ergo_tree().to_base16_bytes(),
        'hex'
      ),
      undefined,
      32
    )
  ).toString('hex');
  return scriptHash;
};

/**
 * converts bigint to Uint8Array
 *
 * @param {bigint} num
 * @return {Uint8Array}
 */
export const bigIntToUint8Array = (num: bigint): Uint8Array => {
  const b = new ArrayBuffer(8);
  new DataView(b).setBigUint64(0, num);
  return new Uint8Array(b);
};

/**
 * converts Uint8Array bytes to a hex string
 *
 * @param {Uint8Array} bytes
 * @return {string}
 */
export const uint8ArrayToHex = (bytes: Uint8Array): string => {
  return Buffer.from(bytes).toString('hex');
};

/**
 * converts a hex string to Uint8Array bytes
 *
 * @param {string} hex
 * @return {Uint8Array}
 */
export const hexToUint8Array = (hex: string): Uint8Array =>
  Uint8Array.from(Buffer.from(hex, 'hex'));
