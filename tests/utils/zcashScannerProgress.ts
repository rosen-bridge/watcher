import '@rosen-bridge/extended-typeorm/bootstrap';
import { expect } from 'chai';
import { DummyLogger } from '@rosen-bridge/abstract-logger';
import { DataSource } from '@rosen-bridge/extended-typeorm';
import {
  BlockEntity,
  ExtractorStatusEntity,
} from '@rosen-bridge/abstract-scanner';
import { ZcashRpcScanner } from '@rosen-bridge/zcash-scanner';
import {
  guardZcashExtraction,
  guardZcashUpdate,
  getZcashReadiness,
  ZcashScannerLogger,
} from '../../src/utils/zcashReadiness';

describe('Zcash durable scanner progress', () => {
  it('keeps a stored pending tip closed, and does not advance after a swallowed extraction error', async () => {
    const db = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      entities: [BlockEntity, ExtractorStatusEntity],
    }).initialize();
    try {
      const logger = new ZcashScannerLogger(new DummyLogger());
      let tip = 1;
      let fail = false;
      let release: (() => void) | undefined;
      let entered: (() => void) | undefined;
      let enter = Promise.resolve();
      const scanner = new ZcashRpcScanner({
        dataSource: db,
        initialHeight: 0,
        heightGap: 1,
        logger,
        network: {
          getCurrentHeight: async () => tip,
          getBlockAtHeight: async (height: number) => ({
            height,
            hash: `block${height}`,
            parentHash: `block${height - 1}`,
            timestamp: height * 75,
          }),
          getBlockTxs: async () => [],
        },
      });
      scanner.update = guardZcashUpdate(logger, scanner.update.bind(scanner));
      await scanner.registerExtractor({
        getId: () => 'controlled-extractor',
        initializeData: async () => undefined,
        forkBlock: async () => undefined,
        hasEventInHeightRange: async () => true,
        createUsedBlocksQuery: () => undefined,
        processTransactions: guardZcashExtraction(logger, async () => {
          entered?.();
          await enter;
          if (fail) logger.error('swallowed extraction failure');
          return true;
        }),
      });
      await scanner.update();
      expect((await scanner.action.getLastSavedBlock())?.height).to.equal(1);
      expect((await getZcashReadiness(scanner, logger)).state).to.equal(
        'ready'
      );
      tip = 2;
      enter = new Promise<void>((resolve) => {
        release = resolve;
      });
      const processing = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const update = scanner.update();
      await processing;
      expect(
        (await db.getRepository(BlockEntity).findOneBy({ height: 2 }))?.status
      ).to.equal('PROCESSING');
      expect((await getZcashReadiness(scanner, logger)).state).to.equal(
        'catching-up'
      );
      fail = true;
      release!();
      await update; // GeneralScanner intentionally resolves even when extraction failed.
      expect((await scanner.action.getLastSavedBlock())?.height).to.equal(1);
      expect((await getZcashReadiness(scanner, logger)).state).to.equal(
        'halted'
      );
      // A restart loses the in-memory latch, but cannot certify the pending tip.
      const restartedLogger = new ZcashScannerLogger(new DummyLogger());
      const restarted = new ZcashRpcScanner({
        dataSource: db,
        initialHeight: 0,
        heightGap: 1,
        logger: restartedLogger,
        network: {
          getCurrentHeight: async () => tip,
          getBlockAtHeight: async (height: number) => ({
            height,
            hash: `block${height}`,
            parentHash: `block${height - 1}`,
            timestamp: height * 75,
          }),
          getBlockTxs: async () => [],
        },
      });
      restarted.update = guardZcashUpdate(
        restartedLogger,
        restarted.update.bind(restarted)
      );
      await restarted.registerExtractor({
        getId: () => 'controlled-extractor',
        initializeData: async () => undefined,
        forkBlock: async () => undefined,
        hasEventInHeightRange: async () => true,
        createUsedBlocksQuery: () => undefined,
        processTransactions: guardZcashExtraction(restartedLogger, async () => {
          restartedLogger.error('swallowed extraction failure');
          return true;
        }),
      });
      expect(
        (await getZcashReadiness(restarted, restartedLogger)).state
      ).to.equal('starting');
      await restarted.update();
      expect((await restarted.action.getLastSavedBlock())?.height).to.equal(1);
      expect(
        (await getZcashReadiness(restarted, restartedLogger)).state
      ).to.equal('halted');
      fail = false;
      let rejected = false;
      try {
        await scanner.update();
      } catch {
        rejected = true;
      }
      expect(rejected).to.equal(true);
      expect((await scanner.action.getLastSavedBlock())?.height).to.equal(1);
      expect((await getZcashReadiness(scanner, logger)).state).to.equal(
        'halted'
      );
    } finally {
      await db.destroy();
    }
  });
});
