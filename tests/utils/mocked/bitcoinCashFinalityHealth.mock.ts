import { vi } from 'vitest';

/**
 * Load the real Watcher health registry without starting a scanner or
 * database.
 * @param networkWatcher - Selected Watcher chain
 * @returns The actual singleton, its BCH parameter and scoped module
 * cleanup
 */
export const finalityHealthRegistryFixture = async (
  networkWatcher: 'ergo' | 'bitcoin-cash'
) => {
  vi.resetModules();
  vi.doMock('../../../src/init', () => ({ watcherDatabase: undefined }));
  vi.doMock('../../../src/api/Transaction', () => ({ Transaction: class {} }));
  vi.doMock('../../../src/utils/scanner', () => ({
    CreateScanner: {
      getInstance: () => ({
        getObservationScanner: () => ({ name: () => 'fixture-scanner' }),
      }),
    },
  }));
  vi.doMock('../../../src/config/config', () => ({
    getConfig: () => ({
      general: { networkWatcher, scannerType: 'fixture' },
      notification: {},
      healthCheck: {
        warnLogAllowedCount: 10,
        errorLogAllowedCount: 10,
        logDuration: 600,
        scannerWarnDiff: 2,
        scannerCriticalDiff: 5,
      },
      bitcoinCash: { interval: 180 },
    }),
  }));
  /** Remove only this fixture's module substitutions, including after load failure. */
  const restore = () => {
    vi.doUnmock('../../../src/init');
    vi.doUnmock('../../../src/api/Transaction');
    vi.doUnmock('../../../src/utils/scanner');
    vi.doUnmock('../../../src/config/config');
    vi.resetModules();
  };
  try {
    const { DefaultLogger, DummyLogger } = await import(
      '@rosen-bridge/abstract-logger'
    );
    const { default: CallbackLogger } = await import(
      '@rosen-bridge/callback-logger'
    );
    DefaultLogger.init(new CallbackLogger(new DummyLogger()));
    const { HealthCheckSingleton } = await import(
      '../../../src/utils/healthCheck'
    );
    const { bitcoinCashFinalityHealth } = await import(
      '../../../src/utils/bitcoinCashFinalityHealth'
    );
    return {
      singleton: HealthCheckSingleton.getInstance(),
      diagnostics: bitcoinCashFinalityHealth,
      restore,
    };
  } catch (error) {
    restore();
    throw error;
  }
};
