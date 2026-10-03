import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthCheck, HealthStatusLevel } from '@rosen-bridge/health-check';
import { BitcoinCashFinalityHealth } from '../../src/utils/bitcoinCashFinalityHealth';
import { finalityData } from './bitcoinCashFinalityTestData';
import { finalityHealthDetails } from './bitcoinCashFinalityTestUtils';

describe('BitcoinCashFinalityHealth', () => {
  let registry: HealthCheck;
  let diagnostics: BitcoinCashFinalityHealth;
  beforeEach(() => {
    registry = new HealthCheck();
    diagnostics = new BitcoinCashFinalityHealth();
    registry.register(diagnostics);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDetails', () => {
    /**
     * @target BitcoinCashFinalityHealth.getDetails does not describe an
     * empty history as an eligible event
     * @dependencies Real HealthCheck registry and a new parameter
     * @scenario Read status before any finality attempt
     * @expected Details say no-event-checked, contain no eligibility and
     * identify their limited scope
     */
    it('does not describe an empty history as an eligible event', async () => {
      const status = await registry.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(finalityHealthDetails(status)).toEqual({
        scope: 'latest-event-attempt',
        state: 'no-event-checked',
      });
      expect(status?.description).toContain('not a queue-wide status');
      expect(status?.description).toContain('reusable authorization');
    });
  });
  describe('finish', () => {
    /**
     * @target BitcoinCashFinalityHealth.finish ignores out-of-order
     * completion before and after the newest result
     * @dependencies Real registry and two overlapping synthetic attempts
     * @scenario Complete the older attempt while the newer one is
     * running, then after it fails
     * @expected Neither stale completion replaces the latest block,
     * outcome or timestamp
     */
    it('ignores out-of-order completion before and after the newest result', async () => {
      const older = diagnostics.begin(finalityData.block, 100);
      const latest = diagnostics.begin(finalityData.replacement, 101);
      diagnostics.finish(older, {
        state: 'checked',
        source: 'eligible',
        witness: 'eligible',
      });
      let status = await registry.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
      expect(finalityHealthDetails(status)).toMatchObject({
        state: 'checking',
        block: finalityData.replacement,
        height: 101,
      });
      diagnostics.finish(latest, {
        state: 'checked',
        source: 'eligible',
        witness: 'rpc-failure',
      });
      status = await registry.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
      const newest = status?.details;
      diagnostics.finish(older, {
        state: 'checked',
        source: 'eligible',
        witness: 'eligible',
      });
      expect(
        (await registry.getHealthStatusWithParamId('bitcoin-cash-finality'))
          ?.details
      ).toEqual(newest);
    });
  });
  describe('updateStatus', () => {
    /**
     * @target BitcoinCashFinalityHealth.updateStatus does not refresh
     * the finality evidence timestamp during a health poll
     * @dependencies Real registry and a clock controlling Date only
     * @scenario Refresh the health parameter a minute after the latest
     * completed event check
     * @expected The registry refresh time advances while the finality
     * evidence timestamp stays fixed
     */
    it('does not refresh the finality evidence timestamp during a health poll', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-03T12:00:00.000Z'));
      const generation = diagnostics.begin(finalityData.block, 100);
      diagnostics.finish(generation, {
        state: 'checked',
        source: 'waiting-finalization',
        witness: 'eligible',
      });
      vi.setSystemTime(new Date('2026-10-03T12:01:00.000Z'));
      await registry.update();
      const status = await registry.getHealthStatusWithParamId(
        'bitcoin-cash-finality'
      );
      expect(status?.lastCheck?.toISOString()).toEqual(
        '2026-10-03T12:01:00.000Z'
      );
      expect(finalityHealthDetails(status).checkedAt).toEqual(
        '2026-10-03T12:00:00.000Z'
      );
      expect(status?.status).toEqual(HealthStatusLevel.HEALTHY);
    });
  });
  describe('getHealthStatus', () => {
    /**
     * @target BitcoinCashFinalityHealth.getHealthStatus reports %s
     * instead of retaining eligibility
     * @dependencies Real registry and one selected unsuccessful
     * lifecycle state
     * @scenario Finish with invalid input, invalid configuration or
     * stale evidence
     * @expected An earlier eligible outcome cannot survive the new
     * attempt
     */
    it.each([
      'invalid-observation',
      'invalid-configuration',
      'stale-evidence',
    ] as const)(
      'reports %s instead of retaining eligibility',
      async (state) => {
        const first = diagnostics.begin(finalityData.block, 100);
        diagnostics.finish(first, {
          state: 'checked',
          source: 'eligible',
          witness: 'eligible',
        });
        const second = diagnostics.begin(finalityData.replacement, 101);
        diagnostics.finish(second, { state });
        const status = await registry.getHealthStatusWithParamId(
          'bitcoin-cash-finality'
        );
        expect(status?.status).toEqual(HealthStatusLevel.UNSTABLE);
        expect(finalityHealthDetails(status)).toMatchObject({
          state,
          height: 101,
        });
        expect(finalityHealthDetails(status).source).toBeUndefined();
        expect(finalityHealthDetails(status).witness).toBeUndefined();
      }
    );

    /**
     * @target BitcoinCashFinalityHealth.getHealthStatus does not mark an
     * incomplete endpoint pair healthy
     * @dependencies Real registry with an incomplete checked result
     * @scenario Only the source result is available
     * @expected Missing witness evidence remains unstable
     */
    it('does not mark an incomplete endpoint pair healthy', async () => {
      const generation = diagnostics.begin(finalityData.block, 100);
      diagnostics.finish(generation, { state: 'checked', source: 'eligible' });
      expect(
        (await registry.getHealthStatusWithParamId('bitcoin-cash-finality'))
          ?.status
      ).toEqual(HealthStatusLevel.UNSTABLE);
    });
  });
});
