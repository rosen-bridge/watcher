import { ObservationEntity } from '@rosen-bridge/abstract-observation-extractor';
import { BitcoinCashRpcNetwork } from '@rosen-bridge/bitcoin-cash-scanner';
import { performance } from 'node:perf_hooks';
import { getConfig } from '../config/config';
import { BITCOIN_CASH_CHAIN_NAME } from '../config/constants';

/**
 * Checks the persisted event block on the scanner endpoint and its witness.
 * Every call obtains fresh evidence; a prior eligible result is never reused.
 * Endpoint independence and BCHN finalization policy require operator review.
 * @param observation - Persisted observation associated with the outgoing tx
 */
export const assertBitcoinCashObservationFinality = async (
  observation?: Pick<
    ObservationEntity,
    'fromChain' | 'height' | 'block' | 'sourceBlockId'
  >
): Promise<void> => {
  const config = getConfig();
  if (config.general.networkWatcher !== BITCOIN_CASH_CHAIN_NAME) return;
  if (
    !observation ||
    observation.fromChain !== BITCOIN_CASH_CHAIN_NAME ||
    !Number.isSafeInteger(observation.height) ||
    observation.height < 0 ||
    !/^[0-9a-f]{64}$/.test(observation.sourceBlockId) ||
    observation.sourceBlockId !== observation.block
  )
    throw Error('BCH finality requires the exact persisted source block');
  const { rpc, finalityRpc } = config.bitcoinCash;
  if (
    !rpc ||
    !finalityRpc ||
    new URL(rpc.url).origin === new URL(finalityRpc.url).origin
  )
    throw Error('BCH finality requires a distinct witness RPC');

  // Both endpoints must agree on this exact event, not on a height alone.
  // They need not have identical tips or finalized heights while advancing.
  const started = performance.now();
  await Promise.all(
    [rpc, finalityRpc].map(async (endpoint) => {
      const network = new BitcoinCashRpcNetwork(
        endpoint.url,
        endpoint.timeout * 1000,
        rpc.expectedChain,
        endpoint.username !== undefined && endpoint.password !== undefined
          ? { username: endpoint.username, password: endpoint.password }
          : undefined,
        rpc.limits
      );
      await network.assertFinalizedBlock(
        observation.sourceBlockId,
        observation.height
      );
    })
  );
  if (performance.now() - started > 30_000)
    throw Error(
      'BCH finality evidence exceeded its 30-second freshness budget'
    );
};
