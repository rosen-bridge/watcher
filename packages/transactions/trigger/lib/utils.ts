import {
  ErgoBoxCandidateProxy,
  ErgoBoxProxy,
} from '@rosen-bridge/ergo-box-selection';
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

/**
 * converts from ErgoBoxCandidate to ErgoBoxCandidateProxy
 *
 * @param {ergoLib.ErgoBoxCandidate} box
 * @return {ErgoBoxCandidateProxy}
 */
export const toErgoBoxCandidateProxy = (
  box: ergoLib.ErgoBoxCandidate
): ErgoBoxCandidateProxy =>
  ergoLib.ErgoBox.from_box_candidate(
    box,
    ergoLib.TxId.from_str(
      'c85647df07f4ea14bf4635b1650c6c313366b6ca22a28212a30f82ed658d067c'
    ),
    1
  ).to_js_eip12();

/**
 * converts from ErgoBoxCandidateProxy to ErgoBoxCandidate
 *
 * @param {ErgoBoxCandidateProxy} boxProxy
 * @return {ergoLib.ErgoBoxCandidate}
 */
export const fromErgoBoxCandidateProxy = (
  boxProxy: ErgoBoxCandidateProxy
): ergoLib.ErgoBoxCandidate => {
  const boxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
    ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(boxProxy.value)),
    ergoLib.Contract.new(ergoLib.ErgoTree.from_base16_bytes(boxProxy.ergoTree)),
    boxProxy.creationHeight
  );

  boxProxy.assets.forEach((asset) =>
    boxBuilder.add_token(
      ergoLib.TokenId.from_str(asset.tokenId),
      ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(asset.amount))
    )
  );

  for (let i = 4; i <= 9; i++) {
    const register = boxProxy.additionalRegisters[`R${i}`];
    if (register == undefined) {
      continue;
    }
    boxBuilder.set_register_value(
      i,
      ergoLib.Constant.decode_from_base16(register)
    );
  }

  return boxBuilder.build();
};

/**
 * calculates total value of a box array
 *
 * @param {((ergoLib.ErgoBox | ergoLib.ErgoBoxCandidate)[])} boxes
 * @return {bigint}
 */
export const getTotalValue = (
  boxes: (ergoLib.ErgoBox | ergoLib.ErgoBoxCandidate)[]
): bigint => {
  return boxes
    .map((box) => BigInt(box.value().as_i64().to_str()))
    .reduce((sum, val) => sum + val, 0n);
};
