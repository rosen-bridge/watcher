import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from '@rosen-bridge/extended-typeorm';
import { TxEntity, TxType } from '../../../src/database/entities/txEntity';
import { open } from './watcherModelTestUtils';

describe('WatcherDataBase', () => {
  describe('setTxUpdateHeight', () => {
    let dataSource: DataSource | undefined;
    let databasePath: string | undefined;
    afterEach(async () => {
      if (dataSource?.isInitialized) await dataSource.destroy();
      if (databasePath)
        await unlink(databasePath).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        });
    });

    /**
     * @target WatcherDataBase.setTxUpdateHeight does not overwrite invalid=%s deleted=%s from a stale entity
     * @dependencies real SQLite entity repositories and production migrations
     * @scenario insert a generic transaction; retain its loaded entity; change
     * persisted flags; update height using the stale entity; reread the row
     * @expected only updateBlock changes; persisted validity and deletion survive
     */
    it.each([
      [true, false],
      [false, true],
      [true, true],
    ])(
      'does not overwrite invalid=%s deleted=%s from a stale entity',
      async (invalid, deleted) => {
        const { WatcherDataBase } = await import(
          '../../../src/database/models/watcherModel'
        );
        databasePath = join(
          tmpdir(),
          `watcher-stale-height-${randomUUID()}.sqlite`
        );
        dataSource = await open(databasePath);
        const database = new WatcherDataBase(dataSource);
        await database.submitTx(
          'fixture-serialized-transaction',
          '11'.repeat(32),
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
});
