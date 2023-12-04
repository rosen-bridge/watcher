import * as wasm from 'ergo-lib-wasm-nodejs';
import { Asset } from '../../../src/ergo/network/types';
import { randomBytes } from 'crypto';
import { getConfig } from '../../../src/config/config';

class testBoxes {
  /**
   * generates 32 bytes random data used for the identifiers such as txId
   */
  static generateRandomId = (): string => randomBytes(32).toString('hex');

  /**
   * generates an input box for arbitrary address
   */
  static mockSingleBox = (
    value: string,
    assets: Asset[],
    addressContract: wasm.Contract
  ): wasm.ErgoBox => {
    const boxTokens: wasm.Tokens = new wasm.Tokens();
    assets.forEach((asset) =>
      boxTokens.add(
        new wasm.Token(
          wasm.TokenId.from_str(asset.tokenId),
          wasm.TokenAmount.from_i64(wasm.I64.from_str(asset.amount.toString()))
        )
      )
    );

    return new wasm.ErgoBox(
      wasm.BoxValue.from_i64(wasm.I64.from_str(value)),
      10000,
      addressContract,
      wasm.TxId.from_str(this.generateRandomId()),
      0,
      boxTokens
    );
  };

  /**
   * generates a wid box with wrong token order
   */
  static WidBoxWithWrongOrder = (wid: string): wasm.ErgoBox => {
    const address = wasm.Address.from_base58(getConfig().general.address);
    return this.mockSingleBox(
      '110000000',
      [
        { tokenId: this.generateRandomId(), amount: 10n },
        { tokenId: wid, amount: 1n },
      ],
      wasm.Contract.new(address.to_ergo_tree())
    );
  };

  /**
   * generates a wid box with wrong token order without enough erg
   */
  static WidBoxWithWrongOrderWithoutErg = (wid: string): wasm.ErgoBox => {
    const address = wasm.Address.from_base58(getConfig().general.address);
    return this.mockSingleBox(
      '11000',
      [
        { tokenId: this.generateRandomId(), amount: 10n },
        { tokenId: wid, amount: 1n },
      ],
      wasm.Contract.new(address.to_ergo_tree())
    );
  };
}

export { testBoxes };
