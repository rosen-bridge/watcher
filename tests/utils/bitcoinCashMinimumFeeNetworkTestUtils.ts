import {
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from '@rosen-clients/rate-limited-axios';
import JsonBigInt from '@rosen-bridge/json-bigint';

/** Holds a response without any socket or external network access. */
export const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((fulfill) => {
    resolve = fulfill;
  });
  return { promise, resolve };
};

/** Returns raw JSON through the actual private Axios request/response pipeline. */
export const response = (config: InternalAxiosRequestConfig, data: string) => ({
  config,
  data,
  status: 200,
  statusText: 'OK',
  headers: new AxiosHeaders(),
});

/** Supplies the existing node/explorer wire shapes with a lossless large amount. */
export const box = (kind: 'node' | 'explorer') => ({
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
export const page = (kind: 'node' | 'explorer', rows: unknown[]) =>
  JsonBigInt.stringify(
    kind === 'node' ? rows : { items: rows, total: rows.length }
  );

/** Bounds waiting for a loopback fixture milestone and clears its watchdog. */
export const within = async <T>(promise: Promise<T>): Promise<T> => {
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
