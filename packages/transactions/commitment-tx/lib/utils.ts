import { ErgoBoxProxy } from '@rosen-bridge/ergo-box-selection';
import * as ergoLib from 'ergo-lib-wasm-nodejs';

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
 * converts a hex string to Uint8Array bytes
 *
 * @param {string} hex
 * @return {Uint8Array}
 */
export const hexToUint8Array = (hex: string): Uint8Array =>
  Uint8Array.from(Buffer.from(hex, 'hex'));

/**
 * converts an ErgoBox iterator to ErgoBoxProxy iterator for use with
 * '@rosen-bridge/ergo-box-selection' library
 *
 * @param {Iterator<ergoLib.ErgoBox, undefined>} boxIterator
 * @return {Iterator<ErgoBoxProxy, undefined>}
 */
export const toErgoBoxProxyIterator = (
  boxIterator: Iterator<ergoLib.ErgoBox, undefined>
): Iterator<ErgoBoxProxy, undefined> => {
  return {
    next: (): IteratorResult<ErgoBoxProxy, undefined> => {
      const { value } = boxIterator.next();
      return value != undefined
        ? {
            value: value.to_js_eip12(),
            done: false,
          }
        : { value: undefined, done: true };
    },
  };
};
