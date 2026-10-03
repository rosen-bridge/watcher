import { vi } from 'vitest';

/** One controlled registration promise isolates the asynchronous consumer join. */
const registration = vi.hoisted(() => ({
  started: false,
  resolve: undefined as (() => void) | undefined,
  reject: undefined as ((reason: Error) => void) | undefined,
}));

export { registration };

vi.mock('@rosen-bridge/bitcoin-cash-scanner', () => ({
  BitcoinCashRpcScanner: class {
    /** Delay registration until the scenario settles its one controlled promise. */
    registerExtractor = () =>
      new Promise<void>((resolve, reject) => {
        registration.started = true;
        registration.resolve = resolve;
        registration.reject = reject;
      });
  },
}));
vi.mock('@rosen-bridge/bitcoin-cash-observation-extractor', () => ({
  BitcoinCashRpcObservationExtractor: class {},
}));
vi.mock('../../src/utils/networkConnectorManagers', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../src/utils/networkConnectorManagers')
  >()),
  /** The registration scenarios never request network data. */
  createBitcoinCashRpcNetworkConnectorManager: async () => ({}),
}));
vi.mock('../../src/config/tokensConfig', () => ({
  TokensConfig: {
    /** Supply a constructor-only token placeholder; actual tokens are tested separately. */
    getInstance: () => ({ getTokenMap: () => ({}) }),
  },
}));
