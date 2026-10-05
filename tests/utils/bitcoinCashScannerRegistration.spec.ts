import { registration } from '../mocked/bitcoinCashScannerRegistration.mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateScanner } from '../../src/utils/scanner';

describe('CreateScanner', () => {
  describe('createBitcoinCashScanner', () => {
    beforeEach(() => {
      registration.started = false;
      registration.resolve = undefined;
      registration.reject = undefined;
    });
    /** Invoke only the BCH constructor join with its registration boundary controlled. */
    const construct = () => {
      const instance = Reflect.construct(CreateScanner, []) as {
        createBitcoinCashScanner: (...args: unknown[]) => Promise<void>;
      };
      return instance.createBitcoinCashScanner(
        { initialHeight: -1 },
        {},
        false,
        {}
      );
    };
    /**
     * @target createBitcoinCashScanner - waits for extractor registration
     * @dependencies A single delayed registration promise and inert constructors
     * @scenario Hold registration after construction has begun, then release it
     * @expected Keep construction pending until registration completes
     */
    it('waits for extractor registration', async () => {
      let completed = false;
      const pending = construct().then(() => {
        completed = true;
      });
      await vi.waitFor(() => expect(registration.started).toEqual(true));
      await Promise.resolve();
      expect(completed).toEqual(false);
      registration.resolve?.();
      await pending;
      expect(completed).toEqual(true);
    });
    /**
     * @target createBitcoinCashScanner - propagates extractor registration failure
     * @dependencies One isolated registration rejection and inert constructors
     * @scenario Reject the awaited registration after the BCH scanner is constructed
     * @expected Reject construction with the original registration failure
     */
    it('propagates extractor registration failure', async () => {
      const failure = Error('registration fixture failure');
      const pending = construct();
      const rejected = expect(pending).rejects.toBe(failure);
      await vi.waitFor(() => expect(registration.started).toEqual(true));
      registration.reject?.(failure);
      await rejected;
    });
  });
});
