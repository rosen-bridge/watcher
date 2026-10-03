import config from 'config';
import { vi } from 'vitest';

/**
 * Replace only the configuration readers used by the BCH constructor fixture.
 * @param readValues - Returns the independent values for the current scenario
 * @returns Teardown that restores only these two reader spies
 */
export const mockBitcoinCashConfig = (
  readValues: () => Record<string, unknown>
) => {
  const has = vi
    .spyOn(config, 'has')
    .mockImplementation((key) => Object.hasOwn(readValues(), key));
  const get = vi
    .spyOn(config, 'get')
    .mockImplementation(<T>(key: string): T => readValues()[key] as T);
  /** Restore the fixture's own readers without changing unrelated spies. */
  const restore = () => {
    get.mockRestore();
    has.mockRestore();
  };
  return restore;
};
