import { chainDecoders, chainValidators } from '@rosen-bridge/address-codec';
import { createZcashAddressCodec } from '@rosen-bridge/address-codec-zcash';

/** Codec-only users follow the deployment network; source scanners stay explicit. */
export const getAddressCodecs = (
  supportsZcash: boolean,
  networkWatcher: string,
  ergoNetwork: string,
  configuredZcashNetwork?: string
) => {
  if (!supportsZcash && networkWatcher !== 'zcash') {
    return { validators: chainValidators, decoders: chainDecoders };
  }
  const network =
    configuredZcashNetwork ||
    (networkWatcher !== 'zcash' ? ergoNetwork.toLowerCase() : '');
  if (!['regtest', 'testnet', 'mainnet'].includes(network)) {
    throw new Error('ImproperlyConfigured. zcash.network is invalid');
  }
  const codec = createZcashAddressCodec(
    network as 'regtest' | 'testnet' | 'mainnet'
  );
  return {
    validators: { ...chainValidators, zcash: codec.validateAddress },
    decoders: { ...chainDecoders, zcash: codec.decodeAddress },
  };
};
