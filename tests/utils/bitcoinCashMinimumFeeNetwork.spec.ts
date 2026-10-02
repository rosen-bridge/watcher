import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import { AddressInfo, Socket } from 'node:net';
import {
  AxiosAdapter,
  AxiosHeaders,
  InternalAxiosRequestConfig,
  RateLimitedAxiosConfig,
} from '@rosen-clients/rate-limited-axios';
import { MinimumFeeBox } from '@rosen-bridge/minimum-fee';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { BitcoinCashMinimumFeeNetwork } from '../../src/utils/bitcoinCashMinimumFeeNetwork';

/** Holds a response without any socket or external network access. */
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((fulfill) => {
    resolve = fulfill;
  });
  return { promise, resolve };
};

/** Returns raw JSON through the actual private Axios request/response pipeline. */
const response = (config: InternalAxiosRequestConfig, data: string) => ({
  config,
  data,
  status: 200,
  statusText: 'OK',
  headers: new AxiosHeaders(),
});

/** Supplies the existing node/explorer wire shapes with a lossless large amount. */
const box = (kind: 'node' | 'explorer') => ({
  boxId: 'box',
  transactionId: 'transaction',
  address: 'address',
  index: 0,
  value: 9007199254740993n,
  creationHeight: 1,
  ergoTree: 'tree',
  globalIndex: 1n,
  assets: [
    { tokenId: 'nft', amount: 1n },
    { tokenId: 'token', amount: 1n },
  ],
  additionalRegisters: {
    R4: kind === 'node' ? '0402' : { serializedValue: '0402' },
  },
});

/** Builds either API's page envelope without rounding monetary values. */
const page = (kind: 'node' | 'explorer', rows: unknown[]) =>
  JsonBigInt.stringify(
    kind === 'node' ? rows : { items: rows, total: rows.length }
  );

/** Bounds waiting for a loopback fixture milestone and clears its watchdog. */
const within = async <T>(promise: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(Error('fixture watchdog')), 2000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

describe('BitcoinCashMinimumFeeNetwork', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getBoxesByTokenId', () => {
    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies raw node/explorer pages with one malformed amount field
     * @scenario value or token amount is negative, fractional, oversized or not decimal
     * @expected each isolated field violation rejects before exposing any box
     */
    it.each(
      (['node', 'explorer'] as const).flatMap((kind) =>
        (['value', 'amount'] as const).flatMap((field) =>
          [-1n, 1.5, '-1', '1.5', 'secret', '9'.repeat(21)].map((invalid) => ({
            kind,
            field,
            invalid,
          }))
        )
      )
    )('rejects $kind $field $invalid', async ({ kind, field, invalid }) => {
      const fixture = box(kind);
      const wire =
        field === 'value'
          ? { ...fixture, value: invalid }
          : {
              ...fixture,
              assets: [
                { ...fixture.assets[0], amount: invalid },
                fixture.assets[1],
              ],
            };
      const adapter = vi.fn<AxiosAdapter>(async (config) =>
        response(config, page(kind, [wire]))
      );
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        kind,
        adapter
      );
      await expect(
        network.run(Date.now() + 1000, () => network.getBoxesByTokenId('nft'))
      ).rejects.toThrow(
        typeof invalid === 'number' ? 'read failed' : 'invalid response'
      );
      expect(adapter).toHaveBeenCalledTimes(1);
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies actual MinimumFeeBox and private Axios adapter
     * @scenario node and explorer expose a fee box followed by an empty page
     * @expected real fee selection sees exact amounts/registers and shares the NFT read
     */
    it.each([
      ['node', 'numeric'],
      ['explorer', 'numeric'],
      ['node', 'decimal-string'],
      ['explorer', 'decimal-string'],
    ] as const)(
      'preserves %s %s boxes and deduplicates per batch',
      async (kind, representation) => {
        const calls: InternalAxiosRequestConfig[] = [];
        const network = new BitcoinCashMinimumFeeNetwork(
          'http://fee.invalid',
          kind,
          async (config) => {
            calls.push(config);
            const fixture = box(kind);
            const wire =
              representation === 'numeric'
                ? fixture
                : {
                    ...fixture,
                    value: fixture.value.toString(),
                    assets: fixture.assets.map((asset) => ({
                      ...asset,
                      amount: asset.amount.toString(),
                    })),
                  };
            return response(
              config,
              page(kind, config.params.offset === 0 ? [wire] : [])
            );
          }
        );
        const fee = new MinimumFeeBox('token', 'nft', network, () => undefined);
        await network.run(Date.now() + 1000, async () => {
          const results = await Promise.all([
            fee.fetchBox(),
            network.getBoxesByTokenId('nft'),
          ]);
          expect(results[0]).toBe(true);
          expect(fee.getBox()).toMatchObject({
            value: 9007199254740993n,
            txId: 'transaction',
            additionalRegisters: { R4: '0402' },
          });
        });
        expect(calls.map((call) => call.params)).toEqual([
          { offset: 0, limit: 50 },
          { offset: 50, limit: 50 },
        ]);
        expect(calls[0].url).toBe(
          kind === 'node'
            ? '/blockchain/box/unspent/byTokenId/nft'
            : '/api/v1/boxes/unspent/byTokenId/nft'
        );
        expect(
          calls.every(
            (call) =>
              call.maxContentLength === 1048576 &&
              call.maxRedirects === 0 &&
              (call.timeout ?? 0) > 0
          )
        ).toBe(true);
        await network.run(Date.now() + 1000, () =>
          network.getBoxesByTokenId('nft')
        );
        expect(calls).toHaveLength(4);
        expect(calls[2].signal).not.toBe(calls[0].signal);
      }
    );

    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies held adapter, controlled clock
     * @scenario page one arrives only after the batch deadline
     * @expected signal aborts, page two never starts, and the timer is cleared
     */
    it.each(['node', 'explorer'] as const)(
      'stops late %s pagination',
      async (kind) => {
        vi.useFakeTimers();
        const held = deferred<string>();
        const calls: InternalAxiosRequestConfig[] = [];
        const network = new BitcoinCashMinimumFeeNetwork(
          'http://fee.invalid',
          kind,
          async (config) => {
            calls.push(config);
            return response(config, await held.promise);
          }
        );
        const rejected = expect(
          network.run(Date.now() + 100, () => network.getBoxesByTokenId('nft'))
        ).rejects.toThrow('deadline exceeded');
        await vi.advanceTimersByTimeAsync(100);
        await rejected;
        expect(calls).toHaveLength(1);
        expect(calls[0].signal?.aborted).toBe(true);
        held.resolve(page(kind, [box(kind)]));
        await vi.runAllTimersAsync();
        expect(calls).toHaveLength(1);
        expect(vi.getTimerCount()).toBe(0);
      }
    );

    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies finite nonempty pages
     * @scenario the endpoint never sends an empty terminator
     * @expected the twentieth nonempty page rejects without returning partial boxes
     */
    it('enforces the request ceiling', async () => {
      let calls = 0;
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async (config) => {
          calls++;
          return response(config, page('node', [box('node')]));
        }
      );
      await expect(
        network.run(Date.now() + 1000, () => network.getBoxesByTokenId('nft'))
      ).rejects.toThrow('page limit exceeded');
      expect(calls).toBe(20);
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies twenty concurrent distinct NFT reads held at the adapter
     * @scenario a twenty-first read attempts to acquire a request
     * @expected the shared ceiling aborts the first twenty and dispatches no extra request
     */
    it('bounds concurrent requests across distinct NFTs', async () => {
      const entered = deferred<void>();
      const held = deferred<string>();
      const calls: InternalAxiosRequestConfig[] = [];
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async (config) => {
          calls.push(config);
          if (calls.length === 20) entered.resolve();
          return response(config, await held.promise);
        }
      );
      try {
        await expect(
          network.run(Date.now() + 1000, async () => {
            const reads = Promise.all(
              Array.from({ length: 20 }, (_, index) =>
                network.getBoxesByTokenId(String(index))
              )
            );
            const overflow = entered.promise.then(() =>
              network.getBoxesByTokenId('overflow')
            );
            await Promise.all([reads, overflow]);
          })
        ).rejects.toThrow('request limit exceeded');
        expect(calls).toHaveLength(20);
        expect(calls.every((call) => call.signal?.aborted)).toBe(true);
      } finally {
        held.resolve('[]');
        network.cancel();
      }
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies individually malformed or oversized raw pages
     * @scenario the server ignores the row limit or sends invalid or excessive data
     * @expected each isolated invalid response fails after one request
     */
    it.each([
      ['non-array', '{}'],
      ['null row', '[null]'],
      ['invalid JSON', 'secret'],
      ['invalid amount', page('node', [{ ...box('node'), value: '1.23' }])],
      [
        'too many rows',
        page(
          'node',
          Array.from({ length: 51 }, () => box('node'))
        ),
      ],
      ['too many bytes', ' '.repeat(1048577)],
    ])('rejects %s', async (_, data) => {
      const adapter = vi.fn<AxiosAdapter>(async (config) =>
        response(config, data)
      );
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        adapter
      );
      await expect(
        network.run(Date.now() + 1000, () => network.getBoxesByTokenId('nft'))
      ).rejects.toThrow('minimum-fee');
      expect(adapter).toHaveBeenCalledTimes(1);
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies pages smaller than the per-response limit
     * @scenario distinct NFT reads together exceed the batch byte ceiling
     * @expected the shared eight MiB ceiling rejects the ninth one MiB response
     */
    it('counts response bytes across all NFT reads', async () => {
      let calls = 0;
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async (config) => {
          calls++;
          return response(config, '[]' + ' '.repeat(1048574));
        }
      );
      await expect(
        network.run(Date.now() + 5000, async () => {
          for (let nft = 0; nft < 9; nft++)
            await network.getBoxesByTokenId(String(nft));
        })
      ).rejects.toThrow('response size limit exceeded');
      expect(calls).toBe(9);
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies adapter error containing credentials and server details
     * @scenario a transport rejects with sensitive text
     * @expected downstream errors contain only a fixed local message
     */
    it('sanitizes transport errors', async () => {
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async () => {
          throw Error('http://user:secret@endpoint.invalid raw server body');
        }
      );
      const error = await network
        .run(Date.now() + 1000, () => network.getBoxesByTokenId('nft'))
        .catch((error: Error) => error);
      expect(String(error)).toMatch(
        /^Error: Bitcoin Cash minimum-fee (batch cancelled|read failed)$/
      );
      expect(String(error)).not.toMatch(/secret|endpoint|server/);
    });
  });

  describe('run', () => {
    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies real parser with a clock jump immediately after parsing
     * @scenario parsing the terminal empty page reaches the deadline
     * @expected expired boxes never reach the consumer even though run also checks time
     */
    it('checks time after parsing before exposing boxes', async () => {
      vi.useFakeTimers();
      const deadline = Date.now() + 100;
      const parse = JsonBigInt.parse;
      vi.spyOn(JsonBigInt, 'parse').mockImplementation((text) => {
        const result = parse(text);
        vi.setSystemTime(deadline);
        return result;
      });
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async (config) => response(config, '[]')
      );
      let exposed = false;
      await expect(
        network.run(deadline, async () => {
          await network.getBoxesByTokenId('nft');
          exposed = true;
        })
      ).rejects.toThrow('deadline exceeded');
      expect(exposed).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.run
     * @dependencies private adapter and invalid absolute deadlines
     * @scenario a batch starts with an expired or unsupported timer budget
     * @expected no work is acquired and no timer remains
     */
    it.each([0, -1, NaN, Infinity, 2147483648])(
      'rejects invalid remaining budget %s',
      async (remaining) => {
        vi.useFakeTimers();
        const work = vi.fn(async () => undefined);
        const network = new BitcoinCashMinimumFeeNetwork(
          'http://fee.invalid',
          'node'
        );
        await expect(network.run(Date.now() + remaining, work)).rejects.toThrow(
          'deadline exceeded'
        );
        expect(work).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
      }
    );

    /**
     * @target BitcoinCashMinimumFeeNetwork.run
     * @dependencies held active HTTP adapter and work failure
     * @scenario one part of a batch fails while another request is active
     * @expected failure aborts the active signal and a subsequent batch can proceed
     */
    it('aborts siblings on work failure', async () => {
      const entered = deferred<void>();
      const held = deferred<string>();
      let signal: InternalAxiosRequestConfig['signal'];
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async (config) => {
          signal = config.signal;
          entered.resolve();
          return response(config, await held.promise);
        }
      );
      try {
        await expect(
          network.run(Date.now() + 1000, () =>
            Promise.all([
              network.getBoxesByTokenId('nft'),
              entered.promise.then(() => {
                throw Error('fee parsing failed');
              }),
            ])
          )
        ).rejects.toThrow('fee parsing failed');
        expect(signal?.aborted).toBe(true);
      } finally {
        held.resolve('[]');
        network.cancel();
      }
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.getBoxesByTokenId
     * @dependencies completed cached read and controlled clock
     * @scenario a second consumer requests cached data after the batch deadline
     * @expected that consumer rejects before it can use the cached boxes
     */
    it('does not serve cached boxes after expiry', async () => {
      vi.useFakeTimers();
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async (config) => response(config, '[]')
      );
      const deadline = Date.now() + 100;
      let consumed = false;
      await expect(
        network.run(deadline, async () => {
          await network.getBoxesByTokenId('nft');
          vi.setSystemTime(deadline);
          await network.getBoxesByTokenId('nft');
          consumed = true;
        })
      ).rejects.toThrow('deadline exceeded');
      expect(consumed).toBe(false);
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.run
     * @dependencies held work and repeated invocation
     * @scenario a second batch tries to reuse the active network
     * @expected overlap rejects while the original owner remains usable
     */
    it('rejects overlap and permits a fresh batch after cancellation', async () => {
      const held = deferred<void>();
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async (config) => response(config, '[]')
      );
      const first = network.run(Date.now() + 1000, () => held.promise);
      const rejected = expect(first).rejects.toThrow('cancelled');
      await expect(
        network.run(Date.now() + 1000, async () => undefined)
      ).rejects.toThrow('already active');
      network.cancel();
      await rejected;
      held.resolve();
      await expect(
        network.run(Date.now() + 1000, () => network.getBoxesByTokenId('nft'))
      ).resolves.toEqual([]);
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.run
     * @dependencies clock jump without timer dispatch
     * @scenario the last response completes exactly at the deadline
     * @expected return-time validation rejects even before the watchdog executes
     */
    it('rejects an expired final response', async () => {
      vi.useFakeTimers();
      const deadline = Date.now() + 100;
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee.invalid',
        'node',
        async (config) => {
          vi.setSystemTime(deadline);
          return response(config, '[]');
        }
      );
      await expect(
        network.run(deadline, () => network.getBoxesByTokenId('nft'))
      ).rejects.toThrow('deadline exceeded');
      expect(vi.getTimerCount()).toBe(0);
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.run
     * @dependencies actual rate-limit semaphore and private adapter
     * @scenario a second NFT request waits in the queue until after expiry
     * @expected Axios checks the aborted signal after queue release and never dispatches it
     */
    it('does not dispatch an expired queued request', async () => {
      const pattern = '^http://fee-queue.invalid';
      RateLimitedAxiosConfig.addRule(pattern, 1, 0, 5);
      const held = deferred<string>();
      const entered = deferred<void>();
      const calls: InternalAxiosRequestConfig[] = [];
      const network = new BitcoinCashMinimumFeeNetwork(
        'http://fee-queue.invalid',
        'node',
        async (config) => {
          calls.push(config);
          entered.resolve();
          return response(config, await held.promise);
        }
      );
      try {
        const batch = network.run(Date.now() + 100, () =>
          Promise.all([
            network.getBoxesByTokenId('first'),
            network.getBoxesByTokenId('second'),
          ])
        );
        const rejected = expect(batch).rejects.toThrow('deadline exceeded');
        await within(entered.promise);
        await rejected;
        held.resolve('[]');
        const successor = new BitcoinCashMinimumFeeNetwork(
          'http://fee-queue.invalid',
          'node',
          async (config) => response(config, '[]')
        );
        await expect(
          successor.run(Date.now() + 1000, () =>
            successor.getBoxesByTokenId('successor')
          )
        ).resolves.toEqual([]);
        expect(calls).toHaveLength(1);
        expect(calls[0].signal?.aborted).toBe(true);
      } finally {
        held.resolve('[]');
        network.cancel();
        RateLimitedAxiosConfig.removeRule(pattern);
      }
    });

    /**
     * @target BitcoinCashMinimumFeeNetwork.run
     * @dependencies loopback HTTP server and unmodified native Axios adapter
     * @scenario a server sends headers and an incomplete body then holds the socket
     * @expected deadline rejection physically closes that socket and starts no second page
     */
    it('aborts an active native HTTP response body', async () => {
      const entered = deferred<void>();
      const closed = deferred<void>();
      const sockets = new Set<Socket>();
      let calls = 0;
      const server = createServer((request, reply) => {
        calls++;
        request.socket.once('close', () => closed.resolve());
        reply.writeHead(200, { 'content-type': 'application/json' });
        reply.write('[');
        entered.resolve();
      });
      server.on('connection', (socket) => {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      );
      const network = new BitcoinCashMinimumFeeNetwork(
        `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        'node'
      );
      try {
        const rejected = expect(
          network.run(Date.now() + 400, () => network.getBoxesByTokenId('nft'))
        ).rejects.toThrow('minimum-fee');
        await within(entered.promise);
        await rejected;
        await within(closed.promise);
        expect(calls).toBe(1);
        expect(sockets.size).toBe(0);
      } finally {
        network.cancel();
        for (const socket of sockets) socket.destroy();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });
});
