import {
  ErgoBoxProxy,
  Registers,
  TokenAmountProxy,
} from '@rosen-bridge/ergo-box-selection';
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
 * converts an ErgoBox to ErgoBoxProxy for use with
 * '@rosen-bridge/ergo-box-selection' library
 *
 * @param {ergoLib.ErgoBox} box
 * @return {ErgoBoxProxy}
 */
export const toErgoBoxProxy = (box: ergoLib.ErgoBox): ErgoBoxProxy => {
  const assets: TokenAmountProxy[] = [];
  for (let i = 0; i < box.tokens().len(); i++) {
    const token = box.tokens().get(i);
    assets.push({
      tokenId: token.id().to_str(),
      amount: token.amount().as_i64().to_str(),
    });
  }

  const additionalRegisters: Registers = {};
  for (let i = 4; i <= 9; i++) {
    const value = box.register_value(i);
    if (value != undefined) {
      additionalRegisters[`R${i}`] = value.encode_to_base16();
    }
  }

  return {
    boxId: box.box_id().to_str(),
    transactionId: box.tx_id().to_str(),
    index: box.index(),
    ergoTree: box.ergo_tree().to_base16_bytes(),
    creationHeight: box.creation_height(),
    value: box.value().as_i64().to_str(),
    assets,
    additionalRegisters,
  };
};

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
            value: toErgoBoxProxy(value),
            done: false,
          }
        : { value: undefined, done: true };
    },
  };
};
