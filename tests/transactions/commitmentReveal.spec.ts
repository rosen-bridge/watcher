import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  finalityConsumerFixture,
  fixtureWid,
  observationFixture,
} from '../mocked/bitcoinCashFinalityConsumers.mock';

describe('CommitmentReveal', () => {
  describe('triggerEventCreationTx', () => {
    let fixture: Awaited<ReturnType<typeof finalityConsumerFixture>>;
    beforeEach(async () => {
      fixture = await finalityConsumerFixture();
    });
    afterEach(() => fixture?.restore());
    /** Run the production trigger producer with parsed commitment/repository boxes. */
    const run = async (observation = observationFixture()) => {
      const { CommitmentReveal } = await import(
        '../../src/transactions/commitmentReveal'
      );
      const producer = new CommitmentReveal(
        fixture.watcherUtils,
        fixture.transactionUtils,
        fixture.boxes
      );
      await producer.triggerEventCreationTx(
        [fixture.commitment],
        fixture.repo,
        fixture.repoConfig,
        observation,
        [fixtureWid],
        []
      );
    };
    /**
     * @target CommitmentReveal.triggerEventCreationTx - stops before signing
     * @dependencies Real WASM inputs and TransactionUtils, controlled finality/sign/DB ports
     * @scenario Reject the finality check, then retry the same persisted observation
     * @expected Handled rejection leaves sign, queue and status untouched; retry gates anew
     */
    it('keeps the observation retryable when finality rejects', async () => {
      const observation = observationFixture();
      const before = structuredClone(observation);
      fixture.finality.mockRejectedValueOnce(
        Error('fixture finality unavailable')
      );
      await run(observation);
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
     * @target CommitmentReveal.triggerEventCreationTx - awaits finality completion
     * @dependencies Actual producer with a pending finality promise and controlled signing port
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
     * @target CommitmentReveal.triggerEventCreationTx - orders gate before signing
     * @dependencies Production trigger producer and TransactionUtils, synthetic signing port
     * @scenario Allow the finality port for BCH and a legacy observation
     * @expected Gate precedes signing and persisted observation reaches queue utility
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
          'trigger',
          130,
          observation.requestId
        );
      }
    );
  });
});
