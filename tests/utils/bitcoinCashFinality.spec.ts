import nock from 'nock';
import { performance } from 'node:perf_hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BITCOIN_CASH_RPC_LIMITS } from '@rosen-bridge/bitcoin-cash-scanner';
import { HealthCheck, HealthStatusLevel } from '@rosen-bridge/health-check';
import * as configuration from '../../src/config/config';
import {
  assertBitcoinCashObservationFinality,
  BitcoinCashObservationFinalityError,
} from '../../src/utils/bitcoinCashFinality';
import { bitcoinCashFinalityHealth } from '../../src/utils/bitcoinCashFinalityHealth';
import { finalityHealthDetails } from './bitcoinCashFinalityTestUtils';
import {
  finalityData,
  finalityObservation,
  finalityRpcResult,
} from './bitcoinCashFinalityTestData';
import {
  FinalityRpcCall,
  finalityFaultResult,
  mockFinalityRpc,
} from './mocked/bitcoinCashFinality.mock';

describe('assertBitcoinCashObservationFinality', () => {
  const baseline = configuration.getConfig();
  let current: ReturnType<typeof configuration.getConfig>;
  let restore: () => void;
  let sourceCalls: FinalityRpcCall[];
  let witnessCalls: FinalityRpcCall[];
  let health: HealthCheck;
  beforeEach(() => {
    health = new HealthCheck();
    health.register(bitcoinCashFinalityHealth);
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
   * @target assertBitcoinCashObservationFinality checks both endpoint
   * views for the exact persisted block
   * @dependencies Real scanner RPC clients with two independent mocked
   * transports
   * @scenario Check a persisted observation inside both finalized
   * active chains
   * @expected Read both endpoints and check the exact observed block
   * height
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
    const status = await health.getHealthStatusWithParamId(
      'bitcoin-cash-finality'
    );
    expect(status?.status).toEqual(HealthStatusLevel.HEALTHY);
    expect(finalityHealthDetails(status)).toMatchObject({
      scope: 'latest-event-attempt',
      state: 'checked',
      block: finalityData.block,
      height: 100,
      source: 'eligible',
      witness: 'eligible',
    });
  });

  /**
   * @target assertBitcoinCashObservationFinality rejects a conflicting
   * %s view
   * @dependencies Real RPC clients and one isolated wrong active block
   * hash
   * @scenario Replace only the observed-height hash on the selected
   * endpoint
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
      ).rejects.toMatchObject({
        source: fault === 'source' ? 'branch-disagreement' : 'eligible',
        witness: fault === 'witness' ? 'branch-disagreement' : 'eligible',
      });
      const status = await health.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
      expect(finalityHealthDetails(status)).toMatchObject({
        scope: 'latest-event-attempt',
        source: fault === 'source' ? 'branch-disagreement' : 'eligible',
        witness: fault === 'witness' ? 'branch-disagreement' : 'eligible',
      });
    }
  );

  /**
   * @target assertBitcoinCashObservationFinality reports %s %s without
   * masking the other endpoint
   * @dependencies Real clients, scanner predicates and registry;
   * isolated RPC response faults
   * @scenario Lag or corrupt exactly one endpoint while the other
   * completes successfully
   * @expected Every fault vetoes eligibility; only coherent waiting
   * stays healthy and routine
   */
  it.each([
    ['source', 'waiting-finalization'],
    ['witness', 'waiting-finalization'],
    ['source', 'invalid-evidence'],
    ['witness', 'invalid-evidence'],
    ['source', 'parked-fork'],
    ['witness', 'parked-fork'],
  ] as const)(
    'reports %s %s without masking the other endpoint',
    async (side, fault) => {
      for (const endpoint of ['source', 'witness'] as const)
        mockFinalityRpc(
          finalityData[endpoint],
          endpoint === 'source' ? sourceCalls : witnessCalls,
          endpoint === side ? finalityFaultResult(fault) : finalityRpcResult
        );
      const failure = await assertBitcoinCashObservationFinality(
        finalityObservation
      ).catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(BitcoinCashObservationFinalityError);
      const expected = {
        source: side === 'source' ? fault : 'eligible',
        witness: side === 'witness' ? fault : 'eligible',
      };
      expect(failure).toMatchObject(expected);
      expect(
        (failure as BitcoinCashObservationFinalityError).isRoutineWait()
      ).toEqual(fault === 'waiting-finalization');
      const healthyCalls = side === 'source' ? witnessCalls : sourceCalls;
      expect(
        healthyCalls.filter((call) => call.method === 'getfinalizedblockhash')
      ).toHaveLength(2);
      const status = await health.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(status?.status).toEqual(
        fault === 'waiting-finalization'
          ? HealthStatusLevel.HEALTHY
          : HealthStatusLevel.UNSTABLE
      );
      expect(finalityHealthDetails(status)).toMatchObject({
        scope: 'latest-event-attempt',
        state: 'checked',
        ...expected,
      });
    }
  );

  /**
   * @target assertBitcoinCashObservationFinality reports %s transport
   * failure through the real registry
   * @dependencies Real RPC clients and HealthCheck registry with
   * bounded HTTP failures
   * @scenario Fail source, witness or both transports and await every
   * participating endpoint
   * @expected Refuse eligibility, report rpc-failure on the correct
   * side and omit raw errors
   */
  it.each(['source', 'witness', 'both'] as const)(
    'reports %s transport failure through the real registry',
    async (fault) => {
      const failures: ReturnType<typeof nock>[] = [];
      for (const side of ['source', 'witness'] as const) {
        if (fault === side || fault === 'both')
          failures.push(
            nock(finalityData[side]).post('/').reply(503, 'upstream-detail')
          );
        else
          mockFinalityRpc(
            finalityData[side],
            side === 'source' ? sourceCalls : witnessCalls
          );
      }
      const expected = {
        source:
          fault === 'source' || fault === 'both' ? 'rpc-failure' : 'eligible',
        witness:
          fault === 'witness' || fault === 'both' ? 'rpc-failure' : 'eligible',
      };
      await expect(
        assertBitcoinCashObservationFinality(finalityObservation)
      ).rejects.toMatchObject(expected);
      expect(failures.every((failure) => failure.isDone())).toEqual(true);
      const status = await health.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
      expect(finalityHealthDetails(status)).toMatchObject({
        state: 'checked',
        ...expected,
      });
      expect(status?.details).not.toContain('upstream-detail');
    }
  );

  /**
   * @target assertBitcoinCashObservationFinality rechecks after a
   * previous success
   * @dependencies Real RPC clients and a mutable synthetic witness view
   * @scenario Approve once, then replace the witness event block at
   * the same height
   * @expected The next call fetches new evidence and rejects the
   * changed view
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
   * @target assertBitcoinCashObservationFinality rejects stale joint
   * evidence
   * @dependencies Real clients with consistent mocked views and a
   * monotonic-clock spy
   * @scenario Both endpoints agree but collection spans more than
   * thirty seconds
   * @expected Refuse stale evidence before the caller may sign or
   * broadcast
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
      const status = await health.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
      expect(finalityHealthDetails(status)).toMatchObject({
        state: 'stale-evidence',
        source: 'eligible',
        witness: 'eligible',
      });
    } finally {
      clock.mockRestore();
    }
  });

  /**
   * @target assertBitcoinCashObservationFinality rejects malformed
   * persisted identity %j
   * @dependencies One independently modified observation field; no RPC
   * response
   * @scenario Replace only the specified chain, height or block
   * identity field
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
    const status = await health.getHealthStatusWithParamId(
      'bitcoin-cash-finality'
    );
    expect(finalityHealthDetails(status)).toMatchObject({
      state: 'invalid-observation',
    });
    if ('sourceBlockId' in change)
      expect(finalityHealthDetails(status).block).toBeUndefined();
    if ('height' in change)
      expect(finalityHealthDetails(status).height).toBeUndefined();
    expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
  });

  /**
   * @target assertBitcoinCashObservationFinality rejects a missing
   * persisted observation
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
   * @target assertBitcoinCashObservationFinality rejects a %s witness
   * @dependencies Valid observation and one missing or same-origin
   * endpoint
   * @scenario Remove witness configuration or change only its origin
   * to the source
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
    const status = await health.getHealthStatusWithParamId(
      'bitcoin-cash-finality'
    );
    expect(finalityHealthDetails(status)).toMatchObject({
      state: 'invalid-configuration',
    });
    expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
  });

  /**
   * @target assertBitcoinCashObservationFinality reports a malformed
   * %s URL
   * @dependencies Real gate and registry with one invalid endpoint
   * URL; no transport
   * @scenario Parse an invalid source or witness URL
   * @expected Report invalid-configuration instead of leaving the
   * latest attempt checking
   */
  it.each(['source', 'witness'] as const)(
    'reports a malformed %s URL',
    async (side) => {
      const endpoint =
        side === 'source'
          ? current.bitcoinCash.rpc
          : current.bitcoinCash.finalityRpc;
      if (!endpoint) throw Error('Missing configured endpoint in test fixture');
      endpoint.url = 'not-a-url';
      await expect(
        assertBitcoinCashObservationFinality(finalityObservation)
      ).rejects.toThrow('distinct witness RPC');
      const status = await health.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(finalityHealthDetails(status)).toMatchObject({
        state: 'invalid-configuration',
      });
      expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
      expect(sourceCalls).toEqual([]);
      expect(witnessCalls).toEqual([]);
    }
  );

  /**
   * @target assertBitcoinCashObservationFinality records a failed BCH
   * module load as a completed failure
   * @dependencies Real gate and registry; scanner import factory
   * rejects before either RPC
   * @scenario The BCH module cannot initialize
   * @expected Report both unavailable endpoint checks without leaving
   * stale in-flight state
   */
  it('records a failed BCH module load as a completed failure', async () => {
    vi.doMock('@rosen-bridge/bitcoin-cash-scanner', () => {
      throw Error('fixture BCH module unavailable');
    });
    try {
      await expect(
        assertBitcoinCashObservationFinality(finalityObservation)
      ).rejects.toMatchObject({
        source: 'rpc-failure',
        witness: 'rpc-failure',
      });
      const status = await health.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(finalityHealthDetails(status)).toMatchObject({
        state: 'checked',
        source: 'rpc-failure',
        witness: 'rpc-failure',
      });
      expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
    } finally {
      vi.doUnmock('@rosen-bridge/bitcoin-cash-scanner');
    }
  });

  /**
   * @target assertBitcoinCashObservationFinality does not require BCH
   * evidence for another watcher network
   * @dependencies Non-BCH watcher configuration and unavailable BCH
   * endpoints
   * @scenario Invoke the gate without an observation on an Ergo watcher
   * @expected Return without fetching or requiring any BCH
   * configuration
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
