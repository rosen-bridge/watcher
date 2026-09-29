import { expect } from 'chai';
import { getAddressCodecs } from '../../src/utils/addressCodecs';
import { createZcashAddressCodec } from '@rosen-bridge/address-codec-zcash';

describe('shared token-map address codecs', () => {
  for (const watcher of ['ergo', 'cardano', 'bitcoin', 'binance']) {
    for (const [network, prefix, wrongPrefix] of [
      ['Mainnet', '1cb8', '1d25'],
      ['Testnet', '1d25', '1cb8'],
    ]) {
      it(`${watcher}/${network} starts with Zcash tokens and an empty Zcash configuration`, () => {
        const { decoders, validators } = getAddressCodecs(
          true,
          watcher,
          network,
          ''
        );
        const payload = prefix + '01'.repeat(20);
        const address = createZcashAddressCodec(
          network.toLowerCase() as 'mainnet' | 'testnet'
        ).decodeAddress(payload);
        expect(decoders.zcash(payload)).to.equal(address);
        expect(() => validators.zcash(address)).not.to.throw();
        expect(() => decoders.zcash(wrongPrefix + '01'.repeat(20))).to.throw();
      });
    }
  }
  it('requires an explicit network for a Zcash source scanner', () => {
    expect(() => getAddressCodecs(true, 'zcash', 'Mainnet', '')).to.throw(
      'zcash.network'
    );
  });
  it('rejects an invalid explicit override and honors regtest', () => {
    expect(() => getAddressCodecs(true, 'ergo', 'Mainnet', 'invalid')).to.throw(
      'zcash.network'
    );
    const { decoders } = getAddressCodecs(true, 'ergo', 'Mainnet', 'regtest');
    expect(() => decoders.zcash('1d25' + '01'.repeat(20))).not.to.throw();
  });
});
