import { vi } from 'vitest';
import { TokenMap } from '@rosen-bridge/tokens';

/** Builds a real token map with only the read fixture replaced. */
export const makeMap = (count = 1) => {
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
export const deferredRead = () => {
  let resolve!: (value: boolean) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<boolean>((fulfill, fail) => {
    resolve = fulfill;
    reject = fail;
  });
  return { promise, resolve, reject };
};
