import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** Executes the actual startup consumer with isolated synthetic ports. */
const start = (failure = '', chain = 'bitcoin-cash', hold = false) => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL('./mocked/startupProcess.mock.mjs', import.meta.url)
      ),
    ],
    {
      encoding: 'utf8',
      timeout: 5000,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        STARTUP_FAILURE: failure,
        STARTUP_CHAIN: chain,
        STARTUP_HOLD: hold ? '1' : '0',
      },
    }
  );
  return { ...result, events: result.stdout.trim().split(/\r?\n/) };
};

const jobs = [
  'scannerInit',
  'minimumFeeUpdateJob',
  'healthCheckJob',
  'transactionQueueJob',
  'creation',
  'redeem',
  'reveal',
  'tokenNameJob',
  'revenueJob',
  'widStatusJob',
  'rewardCollection',
];

describe('init', () => {
  describe('Bitcoin Cash startup', () => {
    /**
     * @target init / index startup failure consumer
     * @dependencies child Node process with controlled startup ports
     * @scenario an early prerequisite or minimum-fee read rejects with an open handle
     * @expected actual entry exits 1 before any API or recurring job starts
     */
    it.each([
      'tokens',
      'addresses',
      'scanner-construction',
      'database',
      'migrations',
      'transaction',
      'fees-ready',
    ])('terminates on %s failure', (failure) => {
      const result = start(failure, 'bitcoin-cash', true);
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.events).toContain(failure);
      expect(result.events).not.toContain('api');
      for (const job of jobs) expect(result.events).not.toContain(job);
    });

    /**
     * @target init / index startup failure consumer
     * @dependencies child Node process with already-started service ports
     * @scenario the later transaction setup rejects after services start
     * @expected the actual entry exits 1 and prevents remaining jobs
     */
    it('terminates a later initialization failure despite open handles', () => {
      const result = start('statistic', 'bitcoin-cash', true);
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.events).toContain('api');
      expect(result.events).toContain('scannerInit');
      expect(result.events).not.toContain('creation');
    });

    /**
     * @target init
     * @dependencies successful startup ports
     * @scenario BCH fees resolve successfully
     * @expected fees precede the API and every recurring job, all jobs start once
     */
    it('starts services only after BCH fees are ready', () => {
      const result = start();
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      for (const service of ['api', ...jobs]) {
        expect(result.events.filter((event) => event === service)).toHaveLength(
          1
        );
        expect(result.events.indexOf(service)).toBeGreaterThan(
          result.events.indexOf('fees-ready')
        );
      }
      expect(
        result.events.filter((event) => event === 'fees-start')
      ).toHaveLength(1);
    });
  });

  describe('legacy startup', () => {
    /**
     * @target init
     * @dependencies legacy watcher startup ports
     * @scenario legacy fee initialization fails
     * @expected existing API/scanner ordering and log-only failure remain unchanged
     */
    it('preserves legacy service ordering and failure behavior', () => {
      const result = start('fees-ready', 'bitcoin');
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.events).toContain('logged-error');
      expect(result.events.indexOf('api')).toBeLessThan(
        result.events.indexOf('fees-start')
      );
      expect(result.events.indexOf('scannerInit')).toBeLessThan(
        result.events.indexOf('fees-start')
      );
      expect(result.events).not.toContain('creation');
    });
  });
});
