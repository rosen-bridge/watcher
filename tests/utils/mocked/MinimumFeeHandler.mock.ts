import { vi } from 'vitest';

/** Creates isolated fee policy state and controlled read/construction ports. */
export const createMinimumFeeHandlerMocks = () => {
  const state = {
    config: {
      general: {
        networkWatcher: 'bitcoin-cash',
        scannerType: 'node',
        nodeTimeout: 2,
        explorerTimeout: 3,
        nodeUrl: 'http://node.invalid',
        explorerUrl: 'http://explorer.invalid',
      },
      rosen: { minFeeNFT: 'minimum-fee-nft' },
    },
    fetch: vi.fn<(tokenId: string) => Promise<boolean>>(),
    parse: vi.fn<() => unknown[]>(),
    networkConstruction: vi.fn<() => void>(),
    boxConstruction: vi.fn<() => void>(),
    nodeUrls: [] as string[],
    explorerUrls: [] as string[],
    boxIds: [] as string[],
    batches: [] as number[],
    cancel: vi.fn(),
  };
  const bchNetwork = (() => ({
    BitcoinCashMinimumFeeNetwork: class {
      /** Records the BCH read port selection without replacing its separate tests. */
      constructor(url: string, kind: string) {
        (kind === 'node' ? state.nodeUrls : state.explorerUrls).push(url);
        state.networkConstruction();
      }
      /** Records each fresh batch deadline; handler tests control box acquisition. */
      run = <T>(deadline: number, work: () => Promise<T>) => {
        state.batches.push(deadline);
        return work();
      };
      /** Records cancellation of the owned initialization. */
      cancel = () => state.cancel();
    },
  }))();
  const configPort = (() => ({
    /** Returns the selected initialization policy fixture. */
    getConfig: () => state.config,
  }))();
  const feeLibrary = (() => ({
    MinimumFeeNodeNetwork: class {
      /** Records node selection and applies a controlled construction delay. */
      constructor(url: string) {
        state.nodeUrls.push(url);
        state.networkConstruction();
      }
    },
    MinimumFeeExplorerNetwork: class {
      /** Records explorer selection and applies a controlled construction delay. */
      constructor(url: string) {
        state.explorerUrls.push(url);
        state.networkConstruction();
      }
    },
    MinimumFeeBox: class {
      /** Records the configured token and applies a controlled construction delay. */
      constructor(private tokenId: string) {
        state.boxIds.push(tokenId);
        state.boxConstruction();
      }
      /** Returns the controlled read outcome without creating a network client. */
      fetchBox = () => state.fetch(this.tokenId);
      /** Returns the controlled register parse outcome. */
      getConfigs = () => state.parse();
    },
  }))();
  class Logger {
    /** Keeps the immutable logger port independent of mock restoration. */
    child = () => this;
    /** Accepts debug output from the initialization under test. */
    debug = () => undefined;
    /** Accepts successful initialization output. */
    info = () => undefined;
  }
  const logger = new Logger();
  return {
    state,
    bchNetwork,
    configPort,
    feeLibrary,
    DefaultLogger: {
      /** Supplies an immutable logger port for the initialization under test. */
      getInstance: () => logger,
    },
  };
};
