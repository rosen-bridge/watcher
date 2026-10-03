import nock from 'nock';
import { performance } from 'node:perf_hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BITCOIN_CASH_RPC_LIMITS } from '@rosen-bridge/bitcoin-cash-scanner';
import * as configuration from '../../src/config/config';
import { assertBitcoinCashObservationFinality } from '../../src/utils/bitcoinCashFinality';
import {
  finalityData,
  finalityObservation,
  finalityRpcResult,
} from './bitcoinCashFinalityTestData';
import {
  FinalityRpcCall,
  mockFinalityRpc,
} from './mocked/bitcoinCashFinality.mock';

describe('assertBitcoinCashObservationFinality', () => {
  const baseline = configuration.getConfig();
  let current: ReturnType<typeof configuration.getConfig>;
  let restore: () => void;
  let sourceCalls: FinalityRpcCall[];
  let witnessCalls: FinalityRpcCall[];
  beforeEach(() => {
    current = {
      ...baseline,
      general: { ...baseline.general, networkWatcher: 'bitcoin-cash' },
      bitcoinCash: {
        type: 'rpc',
        initialHeight: -1,
        interval: 180,
        rpc: {
          url: finalityData.source,
          timeout: 10,
          expectedChain: 'regtest',
          limits: BITCOIN_CASH_RPC_LIMITS,
        },
        finalityRpc: { url: finalityData.witness, timeout: 10 },
      },
    };
    const spy = vi
      .spyOn(configuration, 'getConfig')
      .mockImplementation(() => current);
    restore = () => spy.mockRestore();
    sourceCalls = [];
    witnessCalls = [];
    nock.disableNetConnect();
  });
  afterEach(() => {
    restore();
    nock.cleanAll();
    nock.enableNetConnect();
  });

  /**
   * @target assertBitcoinCashObservationFinality - requires both endpoint views
   * @dependencies Real scanner RPC clients with two independent mocked transports
   * @scenario Check a persisted observation inside both finalized active chains
   * @expected Read both endpoints and check the exact observed block height
   */
  it('checks both endpoint views for the exact persisted block', async () => {
    mockFinalityRpc(finalityData.source, sourceCalls);
    mockFinalityRpc(finalityData.witness, witnessCalls);
    await expect(
      assertBitcoinCashObservationFinality(finalityObservation)
    ).resolves.toBeUndefined();
    for (const calls of [sourceCalls, witnessCalls]) {
      expect(calls).toContainEqual({ method: 'getblockhash', params: [100] });
      expect(
        calls.filter((call) => call.method === 'getfinalizedblockhash')
      ).toHaveLength(2);
    }
  });

  /**
   * @target assertBitcoinCashObservationFinality - rejects one disagreeing endpoint
   * @dependencies Real RPC clients and one isolated wrong active block hash
   * @scenario Replace only the observed-height hash on the selected endpoint
   * @expected Refuse eligibility even though the other endpoint agrees
   */
  it.each(['source', 'witness'] as const)(
    'rejects a conflicting %s view',
    async (fault) => {
      for (const side of ['source', 'witness'] as const)
        mockFinalityRpc(
          finalityData[side],
          side === 'source' ? sourceCalls : witnessCalls,
          (method, params) =>
            side === fault && method === 'getblockhash' && params[0] === 100
              ? finalityData.replacement
              : finalityRpcResult(method, params)
        );
      await expect(
        assertBitcoinCashObservationFinality(finalityObservation)
      ).rejects.toThrow();
    }
  );

  /**
   * @target assertBitcoinCashObservationFinality - never reuses a previous success
   * @dependencies Real RPC clients and a mutable synthetic witness view
   * @scenario Approve once, then replace the witness event block at the same height
   * @expected The next call fetches new evidence and rejects the changed view
   */
  it('rechecks after a previous success', async () => {
    let changed = false;
    mockFinalityRpc(finalityData.source, sourceCalls);
    mockFinalityRpc(finalityData.witness, witnessCalls, (method, params) =>
      changed && method === 'getblockhash' && params[0] === 100
        ? finalityData.replacement
        : finalityRpcResult(method, params)
    );
    await assertBitcoinCashObservationFinality(finalityObservation);
    changed = true;
    await expect(
      assertBitcoinCashObservationFinality(finalityObservation)
    ).rejects.toThrow();
    expect(
      witnessCalls.filter(
        (call) => call.method === 'getblockhash' && call.params[0] === 100
      )
    ).toHaveLength(2);
  });

  /**
   * @target assertBitcoinCashObservationFinality - bounds joint evidence age
   * @dependencies Real clients with consistent mocked views and a monotonic-clock spy
   * @scenario Both endpoints agree but collection spans more than thirty seconds
   * @expected Refuse stale evidence before the caller may sign or broadcast
   */
  it('rejects stale joint evidence', async () => {
    mockFinalityRpc(finalityData.source, sourceCalls);
    mockFinalityRpc(finalityData.witness, witnessCalls);
    const clock = vi
      .spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValue(30_001);
    try {
      await expect(
        assertBitcoinCashObservationFinality(finalityObservation)
      ).rejects.toThrow('freshness budget');
    } finally {
      clock.mockRestore();
    }
  });

  /**
   * @target assertBitcoinCashObservationFinality - rejects malformed persisted identity
   * @dependencies One independently modified observation field; no RPC response
   * @scenario Replace only the specified chain, height or block identity field
   * @expected Reject before a network request can be made
   */
  it.each([
    { fromChain: 'bitcoin' },
    { height: -1 },
    { height: 1.5 },
    { sourceBlockId: 'invalid' },
    { block: finalityData.replacement },
  ])('rejects malformed persisted identity %j', async (change) => {
    await expect(
      assertBitcoinCashObservationFinality({
        ...finalityObservation,
        ...change,
      })
    ).rejects.toThrow('exact persisted source block');
  });

  /**
   * @target assertBitcoinCashObservationFinality - refuses an absent observation
   * @dependencies BCH selection with no persisted observation
   * @scenario Invoke the gate for an event whose relation is missing
   * @expected Reject without a network request
   */
  it('rejects a missing persisted observation', async () => {
    await expect(assertBitcoinCashObservationFinality()).rejects.toThrow(
      'exact persisted source block'
    );
  });

  /**
   * @target assertBitcoinCashObservationFinality - requires a separate witness
   * @dependencies Valid observation and one missing or same-origin endpoint
   * @scenario Remove witness configuration or change only its origin to the source
   * @expected Reject before attempting either node
   */
  it.each(['missing', 'same-origin'])('rejects a %s witness', async (mode) => {
    current.bitcoinCash.finalityRpc =
      mode === 'missing'
        ? undefined
        : { url: finalityData.source + '/other', timeout: 10 };
    await expect(
      assertBitcoinCashObservationFinality(finalityObservation)
    ).rejects.toThrow('distinct witness RPC');
  });

  /**
   * @target assertBitcoinCashObservationFinality - preserves legacy watcher behavior
   * @dependencies Non-BCH watcher configuration and unavailable BCH endpoints
   * @scenario Invoke the gate without an observation on an Ergo watcher
   * @expected Return without fetching or requiring any BCH configuration
   */
  it('does not require BCH evidence for another watcher network', async () => {
    current.general.networkWatcher = 'ergo';
    current.bitcoinCash.rpc = undefined;
    current.bitcoinCash.finalityRpc = undefined;
    await expect(
      assertBitcoinCashObservationFinality()
    ).resolves.toBeUndefined();
  });
});
