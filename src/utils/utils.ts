import * as ergoLib from 'ergo-lib-wasm-nodejs';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { Buffer } from 'buffer';

/**
 * returns the decoded input hex string
 * @param str
 */
const hexStrToUint8Array = (str: string): Uint8Array => {
  return new Uint8Array(Buffer.from(str, 'hex'));
};

/**
 * Encodes the uint array to the hex string
 * @param buffer
 */
const uint8ArrayToHex = (buffer: Uint8Array): string => {
  return Buffer.from(buffer).toString('hex');
};

/**
 * returns the decoded bigint input
 * @param num
 */
function bigIntToUint8Array(num: bigint) {
  const b = new ArrayBuffer(8);
  new DataView(b).setBigUint64(0, num);
  return new Uint8Array(b);
}

/**
 * returns the decoded base64 input string
 * @param base64
 */
const base64ToArrayBuffer = (base64: string): Uint8Array => {
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
function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * returns a random secret key along with its associate address
 * @param networkType
 */
const generateSK = (
  networkType: wasm.NetworkPrefix = wasm.NetworkPrefix.Mainnet
): { address: string; secret: string } => {
  const secretKey = ergoLib.SecretKey.random_dlog();
  return {
    address: secretKey.get_address().to_base58(networkType),
    secret: uint8ArrayToHex(secretKey.to_bytes()),
  };
};

/**
 * returns address of the ergoTree
 * @param ergoTree
 * @param networkType
 */
const ergoTreeToBase58Address = (
  ergoTree: wasm.ErgoTree,
  networkType: wasm.NetworkPrefix = wasm.NetworkPrefix.Mainnet
): string => {
  return wasm.Address.recreate_from_ergo_tree(ergoTree).to_base58(networkType);
};

const totalBoxValues = (boxes: Array<wasm.ErgoBox>): bigint => {
  return boxes
    .map((box) => BigInt(box.value().as_i64().to_str()))
    .reduce((a, b) => a + b, BigInt(0));
};

export {
  hexStrToUint8Array,
  uint8ArrayToHex,
  delay,
  bigIntToUint8Array,
  generateSK,
  base64ToArrayBuffer,
  ergoTreeToBase58Address,
  totalBoxValues,
};
