import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import nock from 'nock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BITCOIN_CASH_RPC_LIMITS } from '@rosen-bridge/bitcoin-cash-scanner';
import * as configuration from '../../src/config/config';
import { assertBitcoinCashObservationFinality } from '../../src/utils/bitcoinCashFinality';
import {
  CompatibilityRpcCall,
  mockCompatibilityEndpoint,
} from './mocked/bitcoinCashGuardCompatibility.mock';
import fixture from './testData/bitcoinCashFinality.json';

describe('BCH Watcher finality with the Guard compatibility fixture', () => {
  const source = 'https://bch-source.example.test';
  const witness = 'https://bch-witness.example.test';
  const observation = {
    fromChain: 'bitcoin-cash',
    height: fixture.sourceBlock.height,
    block: fixture.sourceBlock.hash,
    sourceBlockId: fixture.sourceBlock.hash,
  };
  let restore: () => void;
  let sourceCalls: CompatibilityRpcCall[];
  let witnessCalls: CompatibilityRpcCall[];

  beforeEach(() => {
    const baseline = configuration.getConfig();
    const spy = vi.spyOn(configuration, 'getConfig').mockReturnValue({
      ...baseline,
      general: { ...baseline.general, networkWatcher: 'bitcoin-cash' },
      bitcoinCash: {
        type: 'rpc',
        initialHeight: -1,
        interval: 180,
        rpc: {
          url: source,
          timeout: 10,
          expectedChain: 'regtest',
          limits: BITCOIN_CASH_RPC_LIMITS,
        },
        finalityRpc: { url: witness, timeout: 10 },
      },
    });
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
   * @target assertBitcoinCashObservationFinality - accepts the common Guard-compatible block
   * @dependencies Actual Watcher gate and scanner clients, independently mocked
   * HTTP endpoints, exact shared synthetic JSON used by the Guard SQLite fixture.
   * @scenario Read both finalized endpoint snapshots for the persisted source
   * block at height 101 with eleven confirmations; pin the common fixture bytes.
   * @expected Both endpoints pass and inspect the same block used in Guard admission.
   */
  it('accepts the common Guard-compatible block', async () => {
    mockCompatibilityEndpoint(source, sourceCalls);
    mockCompatibilityEndpoint(witness, witnessCalls);
    await expect(
      assertBitcoinCashObservationFinality(observation)
    ).resolves.toBeUndefined();
    for (const calls of [sourceCalls, witnessCalls]) {
      expect(calls).toContainEqual({
        method: 'getblockhash',
        params: [fixture.sourceBlock.height],
      });
      expect(
        calls.filter(({ method }) => method === 'getfinalizedblockhash')
      ).toHaveLength(2);
    }
    const bytes = readFileSync(
      new URL('./testData/bitcoinCashFinality.json', import.meta.url),
      'utf8'
    ).replace(/\r\n/g, '\n');
    expect(createHash('sha256').update(bytes).digest('hex')).toEqual(
      '32e98ac41706c86e5985ae20a462fb8c498dbdb0da66933635efdced74e2b552'
    );
  });

  /**
   * @target assertBitcoinCashObservationFinality - refuses a single endpoint branch conflict
   * @dependencies Actual Watcher gate and scanner clients, independent HTTP mocks.
   * @scenario Change only the selected endpoint's source-height block hash
   * while the other endpoint retains the shared eligible Guard fixture.
   * @expected The compatible endpoint cannot override the conflicting endpoint's veto.
   */
  it.each(['source', 'witness'] as const)(
    'refuses a conflicting %s branch',
    async (side) => {
      mockCompatibilityEndpoint(source, sourceCalls, side !== 'source');
      mockCompatibilityEndpoint(witness, witnessCalls, side !== 'witness');
      await expect(
        assertBitcoinCashObservationFinality(observation)
      ).rejects.toThrow();
    }
  );
});
