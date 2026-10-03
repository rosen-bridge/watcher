import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from '@rosen-bridge/extended-typeorm';
import {
  BoxEntity,
  migrations as addressMigrations,
} from '@rosen-bridge/address-extractor';
import {
  ObservationEntity,
  migrations as observationMigrations,
} from '@rosen-bridge/abstract-observation-extractor';
import {
  BlockEntity,
  ExtractorStatusEntity,
  migrations as scannerMigrations,
} from '@rosen-bridge/abstract-scanner';
import {
  CommitmentEntity,
  EventTriggerEntity,
  PermitEntity,
  CollateralEntity,
  migrations as extractorMigrations,
} from '@rosen-bridge/watcher-data-extractor';
import {
  ObservationStatusEntity,
  TxStatus,
} from '../../src/database/entities/observationStatusEntity';
import { TxEntity, TxType } from '../../src/database/entities/txEntity';
import { TokenEntity } from '../../src/database/entities/tokenEntity';
import { RevenueEntity } from '../../src/database/entities/revenueEntity';
import { RevenueView } from '../../src/database/entities/revenueView';
import { RevenueChartDataView } from '../../src/database/entities/revenueChartDataView';
import migrations from '../../src/database/migrations';
import {
  finalityConsumerFixture,
  observationFixture,
} from '../mocked/bitcoinCashFinalityConsumers.mock';

describe('Queue persisted finality integration', () => {
  let fixture: Awaited<ReturnType<typeof finalityConsumerFixture>>;
  let dataSource: DataSource | undefined;
  let databasePath: string | undefined;
  const restores: Array<() => void> = [];
  afterEach(async () => {
    restores
      .splice(0)
      .reverse()
      .forEach((restore) => restore());
    fixture?.restore();
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (databasePath)
      await unlink(databasePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
  });
  /**
   * Reopen a real SQLite database with the production entity and migration set.
   * @param path - Machine-local temporary database file
   * @returns Migrated DataSource whose repository relations are unmocked
   */
  const open = async (path: string): Promise<DataSource> => {
    const source = new DataSource({
      type: 'sqlite',
      database: path,
      synchronize: false,
      logging: false,
      entities: [
        BlockEntity,
        ExtractorStatusEntity,
        BoxEntity,
        ObservationEntity,
        CommitmentEntity,
        EventTriggerEntity,
        PermitEntity,
        CollateralEntity,
        ObservationStatusEntity,
        TxEntity,
        TokenEntity,
        RevenueView,
        RevenueEntity,
        RevenueChartDataView,
      ],
      migrations: [
        ...addressMigrations.sqlite,
        ...observationMigrations.sqlite,
        ...scannerMigrations.sqlite,
        ...extractorMigrations.sqlite,
        ...migrations.sqlite,
      ],
    });
    await source.initialize();
    await source.runMigrations();
    return source;
  };
  /**
   * @target Queue.job - gates the exact persisted event after SQLite reconnect
   * @dependencies Real SQLite migrations, WatcherDataBase, WatcherUtils and WASM transaction;
   * external Ergo/finality ports only are controlled
   * @scenario Persist a trigger and observation, close/reopen, reject finality,
   * then allow a fresh Queue instance to retry
   * @expected Source-block fields survive relation loading; rejection changes no
   * stored rows or status; fresh success broadcasts and updates the retained tx
   */
  it('retains persisted source identity and retry state across database reconnect', async () => {
    fixture = await finalityConsumerFixture();
    const { WatcherDataBase } = await import(
      '../../src/database/models/watcherModel'
    );
    const { WatcherUtils } = await import('../../src/utils/watcherUtils');
    const { Queue } = await import('../../src/ergo/transaction/queue');
    databasePath = join(tmpdir(), `watcher-finality-${randomUUID()}.sqlite`);
    dataSource = await open(databasePath);
    const observation = observationFixture();
    observation.extractor = 'bitcoin-cash-observation-extractor';
    await dataSource.getRepository(ObservationEntity).save(observation);
    await dataSource.getRepository(ObservationStatusEntity).save({
      observation,
      status: TxStatus.REVEAL_SENT,
    });
    const initialDatabase = new WatcherDataBase(dataSource);
    await initialDatabase.submitTx(
      Buffer.from(fixture.signed.sigma_serialize_bytes()).toString('base64'),
      fixture.signed.id().to_str(),
      TxType.TRIGGER,
      120,
      observation.requestId
    );
    const [initialTx] = await initialDatabase.getAllTxs();
    await initialDatabase.setTxValidStatus(initialTx, false);
    await dataSource.destroy();
    dataSource = await open(databasePath);
    const database = new WatcherDataBase(dataSource);
    const watcher = new WatcherUtils(database, 10, 100);
    const [persisted] = await database.getAllTxs();
    expect(persisted.observation).toEqual(observation);
    expect(persisted.observation).not.toBe(observation);
    expect(persisted.observation?.sourceBlockId).toEqual('11'.repeat(32));
    expect(persisted.observation?.block).toEqual('11'.repeat(32));
    expect(persisted.observation?.height).toEqual(123);
    const transactionBefore = await dataSource.getRepository(TxEntity).find();
    const observationBefore = await dataSource
      .getRepository(ObservationEntity)
      .find();
    const statusBefore = await dataSource
      .getRepository(ObservationStatusEntity)
      .find();
    const confirmation = vi
      .spyOn(fixture.ErgoNetwork, 'getConfNum')
      .mockResolvedValue(-1);
    const send = vi.spyOn(fixture.ErgoNetwork, 'sendTx').mockResolvedValue({
      success: true,
      txId: persisted.txId,
    });
    restores.push(
      () => confirmation.mockRestore(),
      () => send.mockRestore()
    );
    fixture.finality.mockRejectedValueOnce(
      Error('fixture finality unavailable')
    );
    await new Queue(database, watcher).job();
    expect(fixture.finality).toHaveBeenCalledExactlyOnceWith(
      persisted.observation
    );
    expect(send).not.toHaveBeenCalled();
    expect(await dataSource.getRepository(TxEntity).find()).toEqual(
      transactionBefore
    );
    expect(await dataSource.getRepository(ObservationEntity).find()).toEqual(
      observationBefore
    );
    expect(
      await dataSource.getRepository(ObservationStatusEntity).find()
    ).toEqual(statusBefore);
    await new Queue(database, watcher).job();
    expect(fixture.finality).toHaveBeenCalledTimes(2);
    expect(fixture.finality).toHaveBeenLastCalledWith(persisted.observation);
    expect(send).toHaveBeenCalledTimes(1);
    const [retried] = await database.getAllTxs();
    expect(retried.updateBlock).toEqual(130);
    expect(retried.isValid).toEqual(true);
    expect(retried.deleted).toEqual(false);
    expect(retried.txSerialized).toEqual(persisted.txSerialized);
    expect(retried.observation).toEqual(observation);
    expect(
      await dataSource.getRepository(ObservationStatusEntity).find()
    ).toEqual(statusBefore);
  });
  /**
   * @target WatcherDataBase.setTxUpdateHeight - preserves persisted validity/removal flags
   * @dependencies Actual SQLite repositories and a stale originally valid entity
   * @scenario Change validity, deletion, or both in SQL, then update height using
   * the previously loaded entity which still carries the original flags
   * @expected Height advances without resurrecting or revalidating the stored row
   */
  it.each([
    [true, false],
    [false, true],
    [true, true],
  ])(
    'does not overwrite invalid=%s deleted=%s from a stale entity',
    async (invalid, deleted) => {
      fixture = await finalityConsumerFixture();
      const { WatcherDataBase } = await import(
        '../../src/database/models/watcherModel'
      );
      databasePath = join(tmpdir(), `watcher-finality-${randomUUID()}.sqlite`);
      dataSource = await open(databasePath);
      const database = new WatcherDataBase(dataSource);
      await database.submitTx(
        Buffer.from(fixture.signed.sigma_serialize_bytes()).toString('base64'),
        fixture.signed.id().to_str(),
        TxType.PERMIT,
        120
      );
      const [stale] = await database.getAllTxs();
      if (invalid) await database.setTxValidStatus(stale, false);
      if (deleted) await database.removeTx(stale);
      expect(stale.isValid).toEqual(true);
      expect(stale.deleted).toEqual(false);
      const returned = await database.setTxUpdateHeight(stale, 131);
      expect(returned).toBe(stale);
      expect(returned.updateBlock).toEqual(131);
      const persisted = await dataSource
        .getRepository(TxEntity)
        .findOneByOrFail({ id: stale.id });
      expect(persisted.updateBlock).toEqual(131);
      expect(persisted.isValid).toEqual(!invalid);
      expect(persisted.deleted).toEqual(deleted);
      expect(persisted.txSerialized).toEqual(stale.txSerialized);
    }
  );
});
