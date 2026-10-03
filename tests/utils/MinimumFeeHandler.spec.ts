import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenMap } from '@rosen-bridge/tokens';

const state = vi.hoisted(() => ({
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
}));

vi.mock('../../src/utils/bitcoinCashMinimumFeeNetwork', () => ({
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
}));

vi.mock('../../src/config/config', () => ({
  /** Returns the selected initialization policy fixture. */
  getConfig: () => state.config,
}));
vi.mock('@rosen-bridge/abstract-logger', async (importOriginal) => {
  const original = await importOriginal<
    typeof import('@rosen-bridge/abstract-logger')
  >();
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
    ...original,
    DefaultLogger: {
      /** Supplies an immutable logger port for the initialization under test. */
      getInstance: () => logger,
    },
  };
});
vi.mock('@rosen-bridge/minimum-fee', () => ({
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
}));

/** Builds a real token map with only the read fixture replaced. */
const makeMap = (count = 1) => {
  const tokenMap = new TokenMap();
  vi.spyOn(tokenMap, 'getConfig').mockReturnValue(
    Array.from({ length: count }, (_, index) => ({
      ergo: {
        tokenId: `erg-${index}`,
        name: 'ERG fixture',
        decimals: 9,
        type: 'native',
        residency: 'native',
        extra: {},
      },
      'bitcoin-cash': {
        tokenId: 'bch',
        name: 'BCH fixture',
        decimals: 8,
        type: 'native',
        residency: 'native',
        extra: {},
      },
    }))
  );
  return tokenMap;
};

/** Creates a controlled read that may settle after its initialization expires. */
const deferredRead = () => {
  let resolve!: (value: boolean) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<boolean>((fulfill, fail) => {
    resolve = fulfill;
    reject = fail;
  });
  return { promise, resolve, reject };
};

describe('MinimumFeeHandler', () => {
  let handler: typeof import('../../src/utils/MinimumFeeHandler').default;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(1700000000000);
    state.config.general.networkWatcher = 'bitcoin-cash';
    state.config.general.scannerType = 'node';
    state.config.general.nodeTimeout = 2;
    state.config.general.explorerTimeout = 3;
    state.nodeUrls.length = 0;
    state.explorerUrls.length = 0;
    state.boxIds.length = 0;
    state.batches.length = 0;
    state.cancel.mockReset();
    state.fetch.mockReset().mockResolvedValue(true);
    state.parse.mockReset().mockReturnValue([{}]);
    state.networkConstruction.mockReset();
    state.boxConstruction.mockReset();
    handler = (await import('../../src/utils/MinimumFeeHandler')).default;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('update', () => {
    /**
     * @target MinimumFeeHandler.update
     * @dependencies controlled fee boxes and batch port
     * @scenario refresh starts after the initialization deadline has passed
     * @expected each refresh receives a fresh full configured budget
     */
    it('starts a new budget for every BCH refresh', async () => {
      await handler.init(makeMap());
      vi.setSystemTime(1700000010000);
      await handler.getInstance().update();
      vi.setSystemTime(1700000020000);
      await handler.getInstance().update();
      expect(state.batches).toEqual([
        1700000002000, 1700000012000, 1700000022000,
      ]);
      expect(state.fetch).toHaveBeenCalledTimes(3);
    });

    /**
     * @target MinimumFeeHandler.update
     * @dependencies controlled fee-box failure
     * @scenario the library swallows a transport error and returns false
     * @expected refresh rejects and does not acquire the next token
     */
    it('does not report a failed BCH refresh as successful', async () => {
      await handler.init(makeMap(2));
      state.fetch.mockClear().mockResolvedValue(false);
      await expect(handler.getInstance().update()).rejects.toThrow(
        'could not be fetched'
      );
      expect(state.fetch).toHaveBeenCalledTimes(1);
    });

    /**
     * @target MinimumFeeHandler.update
     * @dependencies legacy watcher configuration
     * @scenario a legacy fee read returns false
     * @expected existing update semantics remain unchanged without a BCH batch
     */
    it('preserves legacy refresh behavior', async () => {
      state.config.general.networkWatcher = 'bitcoin';
      await handler.init(makeMap());
      state.fetch.mockResolvedValue(false);
      await handler.getInstance().update();
      expect(state.batches).toEqual([]);
    });
  });

  describe('init', () => {
    /**
     * @target MinimumFeeHandler.init
     * @dependencies real TokenMap with BCH and unrelated bridgeable token sets
     * @scenario an unrelated token has no available fee box
     * @expected BCH reads and publishes only its applicable token set
     */
    it('does not require unrelated token fees for BCH', async () => {
      const [applicable, unrelated] = makeMap(2).getConfig();
      delete unrelated['bitcoin-cash'];
      const map = new TokenMap();
      await map.updateConfigByJson([applicable, unrelated]);
      state.fetch.mockImplementation(async (id) => id === 'erg-0');
      await handler.init(map);
      expect(state.boxIds).toEqual(['erg-0']);
      expect(
        handler.getInstance().getMinimumFeeBoxObject('erg-0')
      ).toBeDefined();
      expect(() =>
        handler.getInstance().getMinimumFeeBoxObject('erg-1')
      ).toThrow('No minimum fee config');
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies real TokenMap containing only unrelated bridgeable tokens
     * @scenario no token set supports BCH
     * @expected initialization rejects and never publishes a handler
     */
    it('rejects a map without applicable BCH tokens', async () => {
      const [unrelated] = makeMap().getConfig();
      delete unrelated['bitcoin-cash'];
      const map = new TokenMap();
      await map.updateConfigByJson([unrelated]);
      await expect(handler.init(map)).rejects.toThrow('could not be fetched');
      expect(state.fetch).not.toHaveBeenCalled();
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies real TokenMap with unrelated bridgeable tokens
     * @scenario a legacy watcher initializes the shared map
     * @expected its existing all-token fee selection remains unchanged
     */
    it('retains all configured fee boxes for legacy watchers', async () => {
      state.config.general.networkWatcher = 'bitcoin';
      const [applicable, unrelated] = makeMap(2).getConfig();
      delete unrelated['bitcoin-cash'];
      const map = new TokenMap();
      await map.updateConfigByJson([applicable, unrelated]);
      await handler.init(map);
      expect(state.boxIds).toEqual(['erg-0', 'erg-1']);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies controlled minimum-fee reads
     * @scenario all configured boxes are fetched and decoded before the deadline
     * @expected the candidate is published and its deadline timer is removed
     */
    it('publishes every fetched and decoded box', async () => {
      await handler.init(makeMap(2));
      expect(state.fetch.mock.calls).toEqual([['erg-0'], ['erg-1']]);
      expect(state.parse).toHaveBeenCalledTimes(2);
      expect(
        handler.getInstance().getMinimumFeeBoxObject('erg-1')
      ).toBeDefined();
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies held read and fake clock
     * @scenario an Ergo node read remains pending through its configured deadline
     * @expected initialization rejects with no public handler or retained timer
     */
    it('bounds a held node read without publishing the candidate', async () => {
      const read = deferredRead();
      state.fetch.mockReturnValue(read.promise);
      const outcome = handler.init(makeMap());
      const rejection = expect(outcome).rejects.toThrow('deadline exceeded');
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      await vi.advanceTimersByTimeAsync(2000);
      await rejection;
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
      read.resolve(true);
      await read.promise;
      await Promise.resolve();
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies held reads and fake clock
     * @scenario a read rejects after its deadline has already rejected initialization
     * @expected the late rejection is consumed and the handler remains absent
     */
    it('consumes a late read rejection', async () => {
      const read = deferredRead();
      state.fetch.mockReturnValue(read.promise);
      const rejection = expect(handler.init(makeMap())).rejects.toThrow(
        'deadline exceeded'
      );
      await vi.advanceTimersByTimeAsync(2000);
      await rejection;
      read.reject(Error('late network failure'));
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(0);
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies controlled explorer read and fake clock
     * @scenario explorer mode uses its own three-second deadline
     * @expected node timeout is ignored and explorer deadline closes initialization
     */
    it('uses the selected explorer deadline', async () => {
      state.config.general.scannerType = 'explorer';
      const read = deferredRead();
      state.fetch.mockReturnValue(read.promise);
      const rejection = expect(handler.init(makeMap())).rejects.toThrow(
        'deadline exceeded'
      );
      await vi.advanceTimersByTimeAsync(2000);
      expect(vi.getTimerCount()).toEqual(1);
      await vi.advanceTimersByTimeAsync(1000);
      await rejection;
      expect(state.nodeUrls).toEqual([]);
      expect(state.explorerUrls).toEqual(['http://explorer.invalid']);
      read.resolve(true);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies selected timeout configuration
     * @scenario the selected timeout cannot be represented by a positive timer
     * @expected initialization rejects before constructing or fetching any box
     */
    it.each([0, -1, Infinity, NaN, 0.0001, 2147483.648])(
      'rejects invalid selected timeout %s',
      async (timeout) => {
        state.config.general.nodeTimeout = timeout;
        await expect(handler.init(makeMap())).rejects.toThrow('Invalid');
        expect(state.nodeUrls).toEqual([]);
        expect(state.fetch).not.toHaveBeenCalled();
        expect(() => handler.getInstance()).toThrow("instance doesn't exist");
        expect(vi.getTimerCount()).toEqual(0);
      }
    );

    /**
     * @target MinimumFeeHandler.init
     * @dependencies independent node and explorer timeout settings
     * @scenario the unselected explorer timeout is invalid
     * @expected valid node initialization still publishes its candidate
     */
    it('ignores an unselected timeout', async () => {
      state.config.general.explorerTimeout = NaN;
      await handler.init(makeMap());
      expect(state.nodeUrls).toEqual(['http://node.invalid']);
      expect(handler.getInstance()).toBeDefined();
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies minimum-fee read returning false
     * @scenario the library catches an unavailable fee box and returns false
     * @expected initialization rejects instead of treating fulfillment as readiness
     */
    it('rejects a fulfilled failed fetch', async () => {
      state.fetch.mockResolvedValue(false);
      await expect(handler.init(makeMap())).rejects.toThrow(
        'could not be fetched'
      );
      expect(state.parse).not.toHaveBeenCalled();
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies one successful read and one failed read
     * @scenario only part of the configured fee-box set is fetched
     * @expected no partially initialized handler is published
     */
    it('rejects a partially fetched box set', async () => {
      state.fetch.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      await expect(handler.init(makeMap(2))).rejects.toThrow(
        'could not be fetched'
      );
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies empty token map
     * @scenario BCH startup has no configured Ergo fee box
     * @expected an empty successful Promise set does not publish readiness
     */
    it('rejects an empty fee-box set', async () => {
      await expect(handler.init(makeMap(0))).rejects.toThrow(
        'could not be fetched'
      );
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies fee-register decoder throwing
     * @scenario a fetched box contains an unreadable fee register
     * @expected decoding failure rejects initialization without publication
     */
    it('rejects an unreadable fee register', async () => {
      state.parse.mockImplementation(() => {
        throw Error('invalid register');
      });
      await expect(handler.init(makeMap())).rejects.toThrow('invalid register');
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies decoded empty fee register
     * @scenario a fetched box decodes to an empty fee history
     * @expected initialization rejects instead of publishing an unusable box
     */
    it('rejects an empty decoded fee history', async () => {
      state.parse.mockReturnValue([]);
      await expect(handler.init(makeMap())).rejects.toThrow(
        'no fee configuration'
      );
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies successful prior handler and failed replacement
     * @scenario a new BCH initialization fails to fetch its configured boxes
     * @expected the old handler cannot masquerade as the failed replacement
     */
    it('withdraws the prior handler while reinitializing', async () => {
      await handler.init(makeMap());
      state.fetch.mockResolvedValue(false);
      await expect(handler.init(makeMap())).rejects.toThrow(
        'could not be fetched'
      );
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies controlled rejection
     * @scenario a read fails before the deadline
     * @expected the original failure propagates and its timer is cleared
     */
    it('clears its timer after a read rejects', async () => {
      state.fetch.mockRejectedValue(Error('network failure'));
      await expect(handler.init(makeMap())).rejects.toThrow('network failure');
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies clock jump without timer dispatch
     * @scenario the last read fulfills at the deadline before its timer executes
     * @expected the absolute deadline rejects the candidate
     */
    it('checks absolute time after a read settles', async () => {
      state.fetch.mockImplementation(async () => {
        vi.setSystemTime(1700000002000);
        return true;
      });
      await expect(handler.init(makeMap())).rejects.toThrow(
        'deadline exceeded'
      );
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies network constructor and clock jump without timer dispatch
     * @scenario constructing the selected network reaches the absolute deadline
     * @expected no read starts and the handler stays unavailable
     */
    it('checks the deadline after network construction', async () => {
      state.networkConstruction.mockImplementation(() => {
        vi.setSystemTime(1700000002000);
      });
      await expect(handler.init(makeMap())).rejects.toThrow(
        'deadline exceeded'
      );
      expect(state.fetch).not.toHaveBeenCalled();
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies fee-box constructor and clock jump without timer dispatch
     * @scenario constructing the fee box reaches the absolute deadline
     * @expected no read starts and the constructor failure path stays handled
     */
    it('checks the deadline after fee-box construction', async () => {
      state.boxConstruction.mockImplementation(() => {
        vi.setSystemTime(1700000002000);
      });
      await expect(handler.init(makeMap())).rejects.toThrow(
        'deadline exceeded'
      );
      expect(state.fetch).not.toHaveBeenCalled();
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies clock jump during the first of two read acquisitions
     * @scenario the first acquisition reaches the deadline before the second starts
     * @expected the second read is never acquired and rejection stays handled
     */
    it('checks the deadline before each read acquisition', async () => {
      state.fetch.mockImplementationOnce(async () => {
        vi.setSystemTime(1700000002000);
        return true;
      });
      await expect(handler.init(makeMap(2))).rejects.toThrow(
        'deadline exceeded'
      );
      expect(state.fetch.mock.calls).toEqual([['erg-0']]);
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies register parser and clock jump without timer dispatch
     * @scenario decoding the fetched register passes the absolute deadline
     * @expected the final publication check rejects the expired candidate
     */
    it('checks the deadline after register decoding', async () => {
      state.parse.mockImplementation(() => {
        vi.setSystemTime(1700000002000);
        return [{}];
      });
      await expect(handler.init(makeMap())).rejects.toThrow(
        'deadline exceeded'
      );
      expect(() => handler.getInstance()).toThrow("instance doesn't exist");
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies held first initialization and successful second initialization
     * @scenario an older candidate completes after a newer candidate is published
     * @expected the older initialization rejects without replacing the newer handler
     */
    it('prevents a superseded candidate from replacing a retry', async () => {
      const read = deferredRead();
      state.fetch.mockReturnValueOnce(read.promise).mockResolvedValue(true);
      const first = handler.init(makeMap());
      const rejection = expect(first).rejects.toThrow('superseded');
      await handler.init(makeMap());
      const current = handler.getInstance();
      read.resolve(true);
      await rejection;
      expect(handler.getInstance()).toBe(current);
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies timed-out first read and successful retry
     * @scenario the original read fulfills after timeout and successful retry
     * @expected its late result cannot replace the retry's handler
     */
    it('keeps a successful retry after a timed-out read settles', async () => {
      const read = deferredRead();
      state.fetch.mockReturnValueOnce(read.promise).mockResolvedValue(true);
      const rejection = expect(handler.init(makeMap())).rejects.toThrow(
        'deadline exceeded'
      );
      await vi.advanceTimersByTimeAsync(2000);
      await rejection;
      await handler.init(makeMap());
      const current = handler.getInstance();
      read.resolve(true);
      await read.promise;
      await Promise.resolve();
      expect(handler.getInstance()).toBe(current);
      expect(vi.getTimerCount()).toEqual(0);
    });

    /**
     * @target MinimumFeeHandler.init
     * @dependencies legacy watcher network and held read
     * @scenario a non-BCH watcher retains its existing early-publication semantics
     * @expected its handler remains accessible and no BCH deadline is installed
     */
    it('preserves the legacy initialization path', async () => {
      state.config.general.networkWatcher = 'bitcoin';
      state.config.general.nodeTimeout = 0;
      const read = deferredRead();
      state.fetch.mockReturnValue(read.promise);
      const outcome = handler.init(makeMap());
      const current = handler.getInstance();
      await vi.advanceTimersByTimeAsync(5000);
      expect(handler.getInstance()).toBe(current);
      expect(vi.getTimerCount()).toEqual(0);
      read.resolve(false);
      await outcome;
      expect(state.parse).not.toHaveBeenCalled();
    });
  });
});
