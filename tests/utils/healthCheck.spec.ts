import { afterEach, describe, expect, it } from 'vitest';
import { HealthStatusLevel } from '@rosen-bridge/health-check';
import { finalityData } from './bitcoinCashFinalityTestData';
import { finalityHealthDetails } from './bitcoinCashFinalityTestUtils';
import { finalityHealthRegistryFixture } from './mocked/bitcoinCashFinalityHealth.mock';

describe('HealthCheckSingleton', () => {
  let fixture:
    | Awaited<ReturnType<typeof finalityHealthRegistryFixture>>
    | undefined;
  afterEach(() => {
    fixture?.restore();
    fixture = undefined;
  });

  describe('getInstance', () => {
    /**
     * @target HealthCheckSingleton.getInstance registers the expected
     * parameters for %s
     * @dependencies Real Watcher singleton and HealthCheck library;
     * mocked scanner/database ports
     * @scenario Construct health checks for BCH and Ergo in separate
     * module contexts
     * @expected BCH exposes the exact registered parameter; Ergo adds no
     * BCH diagnostic
     */
    it.each(['bitcoin-cash', 'ergo'] as const)(
      'registers the expected parameters for %s',
      async (chain) => {
        fixture = await finalityHealthRegistryFixture(chain);
        const status = await fixture.singleton.getParamStatus(
          'bitcoin-cash-finality'
        );
        if (chain === 'ergo') {
          expect(status).toBeUndefined();
        } else {
          expect(status?.id).toEqual('bitcoin-cash-finality');
          const generation = fixture.diagnostics.begin(finalityData.block, 100);
          fixture.diagnostics.finish(generation, {
            state: 'checked',
            source: 'eligible',
            witness: 'parked-fork',
          });
          const changed = await fixture.singleton.getParamStatus(
            'bitcoin-cash-finality'
          );
          expect(changed?.status).toEqual(HealthStatusLevel.UNSTABLE);
          expect(finalityHealthDetails(changed)).toMatchObject({
            scope: 'latest-event-attempt',
            source: 'eligible',
            witness: 'parked-fork',
          });
        }
      }
    );
  });
});
