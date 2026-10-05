import { ObservationEntity } from '@rosen-bridge/abstract-observation-extractor';
import { BitcoinCashFinalityError } from '@rosen-bridge/bitcoin-cash-scanner/dist/network/bitcoinCashFinalityError.js';
import { performance } from 'node:perf_hooks';
import { getConfig } from '../config/config';
import { BITCOIN_CASH_CHAIN_NAME } from '../config/constants';
import {
  bitcoinCashFinalityHealth,
  FinalityEndpointState,
} from './bitcoinCashFinalityHealth';

/** A routine wait remains a veto, but need not be logged as an operator fault. */
export class BitcoinCashObservationFinalityError extends Error {
  /**
   * Describes both failed/eligible endpoint outcomes without exposing RPC errors.
   * @param source - Primary endpoint outcome
   * @param witness - Independent witness outcome
   */
  constructor(
    readonly source: FinalityEndpointState,
    readonly witness: FinalityEndpointState
  ) {
    super(`BCH finality refused: source=${source}, witness=${witness}`);
    this.name = 'BitcoinCashObservationFinalityError';
  }

  /** True only when neither endpoint reports an operator fault. Eligibility still fails. */
  isRoutineWait = (): boolean =>
    [this.source, this.witness].every(
      (state) => state === 'eligible' || state === 'waiting-finalization'
    );
}

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
  const attempt = bitcoinCashFinalityHealth.begin(
    observation && /^[0-9a-f]{64}$/.test(observation.sourceBlockId)
      ? observation.sourceBlockId
      : undefined,
    observation &&
      Number.isSafeInteger(observation.height) &&
      observation.height >= 0
      ? observation.height
      : undefined
  );
  if (
    !observation ||
    observation.fromChain !== BITCOIN_CASH_CHAIN_NAME ||
    !Number.isSafeInteger(observation.height) ||
    observation.height < 0 ||
    !/^[0-9a-f]{64}$/.test(observation.sourceBlockId) ||
    observation.sourceBlockId !== observation.block
  ) {
    bitcoinCashFinalityHealth.finish(attempt, { state: 'invalid-observation' });
    throw Error('BCH finality requires the exact persisted source block');
  }
  const { rpc, finalityRpc } = config.bitcoinCash;
  let distinctOrigins = false;
  try {
    distinctOrigins =
      !!rpc &&
      !!finalityRpc &&
      new URL(rpc.url).origin !== new URL(finalityRpc.url).origin;
  } catch {
    // Invalid endpoint syntax is configuration failure, never an in-flight check.
  }
  if (!rpc || !finalityRpc || !distinctOrigins) {
    bitcoinCashFinalityHealth.finish(attempt, {
      state: 'invalid-configuration',
    });
    throw Error('BCH finality requires a distinct witness RPC');
  }

  // Both endpoints must agree on this exact event, not on a height alone.
  // They need not have identical tips or finalized heights while advancing.
  const started = performance.now();
  const results = await Promise.allSettled(
    [rpc, finalityRpc].map(async (endpoint) => {
      const { BitcoinCashRpcNetwork } = await import(
        '@rosen-bridge/bitcoin-cash-scanner'
      );
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
  const [source, witness] = results.map(
    (result): FinalityEndpointState =>
      result.status === 'fulfilled'
        ? 'eligible'
        : result.reason instanceof BitcoinCashFinalityError
        ? result.reason.code
        : 'rpc-failure'
  );
  if (performance.now() - started > 30_000) {
    bitcoinCashFinalityHealth.finish(attempt, {
      state: 'stale-evidence',
      source,
      witness,
    });
    throw Error(
      'BCH finality evidence exceeded its 30-second freshness budget'
    );
  }
  bitcoinCashFinalityHealth.finish(attempt, {
    state: 'checked',
    source,
    witness,
  });
  if (source !== 'eligible' || witness !== 'eligible')
    throw new BitcoinCashObservationFinalityError(source, witness);
};
