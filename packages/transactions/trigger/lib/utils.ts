import { blake2b } from 'blakejs';
import * as ergoLib from 'ergo-lib-wasm-nodejs';

/**
 * calculates scriptHash for passed Address
 *
 * @param {string} address
 * @return {string}
 */
export const toScriptHash = (address: string): string => {
  const permitScriptHash = Buffer.from(
    blake2b(
      Buffer.from(
        ergoLib.Address.from_base58(address).to_ergo_tree().to_base16_bytes(),
        'hex'
      ),
      undefined,
      32
    )
  ).toString('hex');
  return permitScriptHash;
};
