import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  finalityConsumerFixture,
  fixtureWid,
  observationFixture,
} from '../mocked/bitcoinCashFinalityConsumers.mock';

describe('CommitmentCreation', () => {
  describe('createCommitmentTx', () => {
    let fixture: Awaited<ReturnType<typeof finalityConsumerFixture>>;
    beforeEach(async () => {
      fixture = await finalityConsumerFixture();
    });
    afterEach(() => fixture?.restore());
    /** Run the actual commitment producer over the existing WASM input fixtures. */
    const run = async (observation = observationFixture()) => {
      const { CommitmentCreation } = await import(
        '../../src/transactions/commitmentCreation'
      );
      const producer = new CommitmentCreation(
        fixture.watcherUtils,
        fixture.transactionUtils,
        fixture.boxes
      );
      await producer.createCommitmentTx(
        fixtureWid,
        observation,
        new Uint8Array(32),
        [fixture.permit],
        fixture.wid,
        [],
        3300000n
      );
    };
    /**
     * @target CommitmentCreation.createCommitmentTx - stops before signing
     * @dependencies Real WASM inputs and TransactionUtils, owned finality/sign/DB ports
     * @scenario Reject finality after ordinary transaction preparation succeeds
     * @expected Exact persisted observation reaches gate; no sign, queue or status write
     */
    it('keeps the observation retryable when finality rejects', async () => {
      const observation = observationFixture();
      const before = structuredClone(observation);
      fixture.finality.mockRejectedValueOnce(
        Error('fixture finality unavailable')
      );
      await expect(run(observation)).rejects.toThrow(
        'fixture finality unavailable'
      );
      expect(fixture.finality).toHaveBeenCalledExactlyOnceWith(observation);
      expect(fixture.sign).not.toHaveBeenCalled();
      expect(fixture.submit).not.toHaveBeenCalled();
      expect(fixture.upgrade).not.toHaveBeenCalled();
      expect(observation).toEqual(before);
      await run(observation);
      expect(fixture.finality).toHaveBeenCalledTimes(2);
      expect(fixture.order).toEqual(['finality', 'sign', 'status', 'queue']);
    });
    /**
     * @target CommitmentCreation.createCommitmentTx - awaits finality completion
     * @dependencies Real producer with a pending finality promise and owned signing port
     * @scenario Pause finality after transaction preparation; resolve it explicitly
     * @expected Signing and queue insertion remain untouched until the gate resolves
     */
    it('awaits finality before signing', async () => {
      let release: () => void = () => undefined;
      fixture.finality.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          })
      );
      const pending = run();
      await vi.waitFor(() => expect(fixture.finality).toHaveBeenCalledTimes(1));
      expect(fixture.sign).not.toHaveBeenCalled();
      expect(fixture.submit).not.toHaveBeenCalled();
      release();
      await pending;
      expect(fixture.sign).toHaveBeenCalledTimes(1);
      expect(fixture.submit).toHaveBeenCalledTimes(1);
    });
    /**
     * @target CommitmentCreation.createCommitmentTx - gates every signing attempt
     * @dependencies Actual producer and queue utility with synthetic signing response
     * @scenario Allow finality for BCH and for a legacy observation
     * @expected Await finality before sign and submit the matching persisted observation
     */
    it.each(['bitcoin-cash', 'ergo'])(
      'orders finality before signing for %s',
      async (chain) => {
        const observation = observationFixture();
        observation.fromChain = chain;
        await run(observation);
        expect(fixture.finality).toHaveBeenCalledExactlyOnceWith(observation);
        expect(fixture.order).toEqual(['finality', 'sign', 'status', 'queue']);
        expect(fixture.upgrade).toHaveBeenCalledExactlyOnceWith(observation);
        expect(fixture.submit).toHaveBeenCalledWith(
          expect.any(String),
          fixture.signed.id().to_str(),
          'commitment',
          130,
          observation.requestId
        );
      }
    );
  });
});
