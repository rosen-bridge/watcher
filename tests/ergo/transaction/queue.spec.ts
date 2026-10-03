import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as wasm from 'ergo-lib-wasm-nodejs';
import type { WatcherDataBase } from '../../../src/database/models/watcherModel';
import type { WatcherUtils } from '../../../src/utils/watcherUtils';
import { TxEntity, TxType } from '../../../src/database/entities/txEntity';
import {
  finalityConsumerFixture,
  observationFixture,
} from '../../mocked/bitcoinCashFinalityConsumers.mock';

describe('Queue', () => {
  describe('job', () => {
    let core: Awaited<ReturnType<typeof finalityConsumerFixture>>;
    const restores: Array<() => void> = [];
    beforeEach(async () => {
      core = await finalityConsumerFixture();
    });
    afterEach(() => {
      restores
        .splice(0)
        .reverse()
        .forEach((restore) => restore());
      core?.restore();
    });
    /** Build the production queue over a serialized persisted transaction and owned I/O. */
    const queueFixture = async (type: TxType) => {
      const { Queue } = await import('../../../src/ergo/transaction/queue');
      const row: TxEntity = Object.assign(new TxEntity(), {
        id: 1,
        creationTime: 1,
        updateBlock: 120,
        type,
        txId: core.signed.id().to_str(),
        txSerialized: Buffer.from(core.signed.sigma_serialize_bytes()).toString(
          'base64'
        ),
        observation: observationFixture(),
        deleted: false,
        isValid: true,
      });
      const confirmation = vi
        .spyOn(core.ErgoNetwork, 'getConfNum')
        .mockResolvedValue(-1);
      const send = vi
        .spyOn(core.ErgoNetwork, 'sendTx')
        .mockImplementation(async () => {
          core.order.push('send');
          return { success: true, txId: row.txId };
        });
      restores.push(
        () => confirmation.mockRestore(),
        () => send.mockRestore()
      );
      const valid = vi.fn(async (_tx: TxEntity, value: boolean) => {
        core.order.push('valid');
        row.isValid = value;
      });
      const updateHeight = vi.fn(async (_tx: TxEntity, height: number) => {
        core.order.push('height');
        row.updateBlock = height;
      });
      const remove = vi.fn(async () => {
        row.deleted = true;
      });
      const downgrade = vi.fn(async () => undefined);
      const upgrade = vi.fn(async () => undefined);
      const database = {
        getAllTxs: vi.fn(async () => (row.deleted ? [] : [row])),
        setTxValidStatus: valid,
        setTxUpdateHeight: updateHeight,
        removeTx: remove,
        downgradeObservationTxStatus: downgrade,
        upgradeObservationTxStatus: upgrade,
        getObservationsStatus: vi.fn(async () => true),
      } as unknown as WatcherDataBase;
      const observationValid = vi.fn(async () => true);
      const merged = vi.fn(async () => false);
      const watcher = {
        isObservationValid: observationValid,
        isMergeHappened: merged,
      } as unknown as WatcherUtils;
      return {
        queue: new Queue(database, watcher),
        restart: () => new Queue(database, watcher),
        row,
        confirmation,
        send,
        valid,
        updateHeight,
        remove,
        downgrade,
        upgrade,
        observationValid,
        merged,
      };
    };

    /**
     * @target Queue.job - preserves queued events on finality rejection
     * @dependencies Production queue, real serialized WASM transaction, controlled finality/DB/network ports
     * @scenario Reject finality for an unconfirmed commitment or trigger, then retry
     * @expected No broadcast or status mutation on rejection; retry gates before broadcast
     */
    it.each([TxType.COMMITMENT, TxType.TRIGGER])(
      'retains %s for retry after finality rejection',
      async (type) => {
        const f = await queueFixture(type);
        const before = structuredClone(f.row);
        core.finality.mockRejectedValueOnce(
          Error('fixture finality unavailable')
        );
        await f.queue.job();
        expect(core.finality).toHaveBeenCalledExactlyOnceWith(
          f.row.observation
        );
        expect(f.send).not.toHaveBeenCalled();
        for (const mutate of [
          f.valid,
          f.updateHeight,
          f.remove,
          f.downgrade,
          f.upgrade,
        ])
          expect(mutate).not.toHaveBeenCalled();
        expect(f.row).toEqual(before);
        await f.queue.job();
        expect(core.finality).toHaveBeenCalledTimes(2);
        expect(core.order).toEqual(['finality', 'send', 'valid', 'height']);
        expect(f.send).toHaveBeenCalledTimes(1);
        expect(
          wasm.Transaction.from_json(
            f.send.mock.calls[0][0]
          ).sigma_serialize_bytes()
        ).toEqual(core.signed.sigma_serialize_bytes());
      }
    );

    /**
     * @target Queue.job - rechecks finalized status after queue restart
     * @dependencies New production Queue instance using the same persisted transaction
     * @scenario Broadcast once with eligible finality; restart after the event becomes ineligible
     * @expected Fresh gate sees persisted observation, previous success cannot authorize rebroadcast
     */
    it.each([TxType.COMMITMENT, TxType.TRIGGER])(
      'does not cache finality for restarted %s',
      async (type) => {
        const f = await queueFixture(type);
        await f.queue.job();
        expect(core.order).toEqual(['finality', 'send', 'valid', 'height']);
        expect(core.finality).toHaveBeenCalledExactlyOnceWith(
          f.row.observation
        );
        const before = structuredClone(f.row);
        core.finality.mockRejectedValueOnce(Error('fixture finality changed'));
        await f.restart().job();
        expect(core.finality).toHaveBeenCalledTimes(2);
        expect(core.finality).toHaveBeenLastCalledWith(f.row.observation);
        expect(f.send).toHaveBeenCalledTimes(1);
        expect(f.valid).toHaveBeenCalledTimes(1);
        expect(f.updateHeight).toHaveBeenCalledTimes(1);
        expect(f.remove).not.toHaveBeenCalled();
        expect(f.downgrade).not.toHaveBeenCalled();
        expect(f.upgrade).not.toHaveBeenCalled();
        expect(f.row).toEqual(before);
      }
    );

    /**
     * @target Queue.job - passes non-event transaction types without a finality read
     * @dependencies Production queue and a finality port configured to reject if called
     * @scenario Process detach, redeem, permit or reward without an observation
     * @expected Broadcast succeeds without consulting the event finality gate
     */
    it.each([TxType.DETACH, TxType.REDEEM, TxType.PERMIT, TxType.REWARD])(
      'passes non-event %s without a finality request',
      async (type) => {
        const f = await queueFixture(type);
        f.row.observation = undefined;
        core.finality.mockRejectedValue(Error('must not query event finality'));
        await f.queue.job();
        expect(core.finality).not.toHaveBeenCalled();
        expect(f.send).toHaveBeenCalledTimes(1);
        expect(
          wasm.Transaction.from_json(
            f.send.mock.calls[0][0]
          ).sigma_serialize_bytes()
        ).toEqual(core.signed.sigma_serialize_bytes());
        expect(core.order).toEqual(['send', 'valid', 'height']);
      }
    );

    /**
     * @target Queue.job - allows legacy events through the no-op finality port
     * @dependencies Production event queue with a resolved legacy finality port
     * @scenario Process non-BCH commitment or trigger observations
     * @expected Preserve observation identity and order gate before broadcast
     */
    it.each([TxType.COMMITMENT, TxType.TRIGGER])(
      'preserves legacy %s behavior',
      async (type) => {
        const f = await queueFixture(type);
        const observation = observationFixture();
        observation.fromChain = 'ergo';
        f.row.observation = observation;
        await f.queue.job();
        expect(core.finality).toHaveBeenCalledExactlyOnceWith(
          f.row.observation
        );
        expect(f.send).toHaveBeenCalledTimes(1);
        expect(core.order).toEqual(['finality', 'send', 'valid', 'height']);
      }
    );

    /**
     * @target Queue.job - cannot broadcast an event lacking persisted observation
     * @dependencies Actual queue and a finality port rejecting the missing observation
     * @scenario Retain an otherwise valid serialized event with missing observation relation
     * @expected Forward undefined to finality, retain the queued row and never broadcast
     */
    it.each([TxType.COMMITMENT, TxType.TRIGGER])(
      'blocks %s with missing persisted observation',
      async (type) => {
        const f = await queueFixture(type);
        f.row.observation = undefined;
        const before = structuredClone(f.row);
        core.finality.mockRejectedValue(Error('fixture missing observation'));
        await f.queue.job();
        expect(core.finality).toHaveBeenCalledExactlyOnceWith(undefined);
        expect(f.send).not.toHaveBeenCalled();
        expect(f.row).toEqual(before);
      }
    );

    /**
     * @target Queue.job - honors existing event validity checks before finality
     * @dependencies Production queue with invalid commitment or already merged trigger
     * @scenario Reject the preexisting event validity predicate
     * @expected Skip finality and broadcast, mark invalid using existing queue behavior
     */
    it.each([TxType.COMMITMENT, TxType.TRIGGER])(
      'keeps existing %s validity rejection',
      async (type) => {
        const f = await queueFixture(type);
        f.observationValid.mockResolvedValue(false);
        f.merged.mockResolvedValue(true);
        await f.queue.job();
        expect(core.finality).not.toHaveBeenCalled();
        expect(f.send).not.toHaveBeenCalled();
        expect(f.valid).toHaveBeenCalledExactlyOnceWith(f.row, false);
      }
    );

    /**
     * @target Queue.job - avoids rebroadcast of a mined event
     * @dependencies Production queue with a confirmation response of zero or eleven
     * @scenario Observe an event already mined, either awaiting or past confirmation threshold
     * @expected No broadcast/finality query; retain normal queue confirmation processing
     */
    it.each([
      [TxType.COMMITMENT, 0],
      [TxType.COMMITMENT, 11],
      [TxType.TRIGGER, 0],
      [TxType.TRIGGER, 11],
    ] as const)(
      'does not gate or resend mined %s with %s confirmations',
      async (type, count) => {
        const f = await queueFixture(type);
        f.confirmation.mockResolvedValue(count);
        await f.queue.job();
        expect(core.finality).not.toHaveBeenCalled();
        expect(f.send).not.toHaveBeenCalled();
        expect(f.row.deleted).toEqual(count > 10);
      }
    );
    /**
     * @target Queue.job - waits for finality completion before broadcasting
     * @dependencies Actual queue and a deliberately pending finality promise
     * @scenario Start event processing while the finality response remains pending
     * @expected No broadcast until finality resolves, followed by normal status writes
     */
    it.each([TxType.COMMITMENT, TxType.TRIGGER])(
      'awaits %s finality before sending',
      async (type) => {
        const f = await queueFixture(type);
        let release: () => void = () => undefined;
        core.finality.mockImplementationOnce(
          () =>
            new Promise<void>((resolve) => {
              release = resolve;
            })
        );
        const pending = f.queue.job();
        await vi.waitFor(() => expect(core.finality).toHaveBeenCalledTimes(1));
        expect(f.send).not.toHaveBeenCalled();
        expect(f.valid).not.toHaveBeenCalled();
        release();
        await pending;
        expect(f.send).toHaveBeenCalledTimes(1);
      }
    );
  });
});
