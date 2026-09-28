import '@rosen-bridge/extended-typeorm/bootstrap';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { DummyLogger } from '@rosen-bridge/abstract-logger';
import { DataSource } from '@rosen-bridge/extended-typeorm';
import {
  BlockEntity,
  ExtractorStatusEntity,
} from '@rosen-bridge/abstract-scanner';
import {
  ObservationEntity,
  ObservationEntityAction,
} from '@rosen-bridge/abstract-observation-extractor';
import { ZcashRpcScanner } from '@rosen-bridge/zcash-scanner';
import type { BlockInfo } from '@rosen-bridge/scanner-interfaces';
import {
  guardZcashExtraction,
  guardZcashUpdate,
  getZcashReadiness,
  ZcashScannerLogger,
} from '../../../src/utils/zcashReadiness';

// A test-only child entrypoint. Importing it cannot open a database or start work.
async function main() {
  const [database, mode] = process.argv.slice(2);
  if (!database || !['crash', 'fault', 'recover', 'reorg'].includes(mode))
    throw new Error('Invalid fixture arguments');
  const db = await new DataSource({
    type: 'sqlite',
    database,
    synchronize: true,
    entities: [BlockEntity, ExtractorStatusEntity, ObservationEntity],
  }).initialize();
  try {
    const logger = new ZcashScannerLogger(new DummyLogger());
    const observations = new ObservationEntityAction(db, logger);
    const extractorId = 'process-recovery-fixture';
    let tip = mode === 'crash' ? 1 : 3;
    let replacement = false;
    const hash = (height: number) =>
      `${replacement && height >= 2 ? 'replacement' : 'original'}-${height}`;
    const scanner = new ZcashRpcScanner({
      dataSource: db,
      initialHeight: 0,
      logger,
      network: {
        getCurrentHeight: async () => tip,
        getBlockAtHeight: async (height: number) => ({
          height,
          hash: hash(height),
          parentHash: hash(height - 1),
          timestamp: height * 75,
        }),
        getBlockTxs: async () => [],
      },
    });
    scanner.update = guardZcashUpdate(logger, scanner.update.bind(scanner));
    const summary = async () => ({
      readiness: (await getZcashReadiness(scanner, logger)).state,
      saved: (await scanner.action.getLastSavedBlock())?.height,
      blocks: (
        await db.getRepository(BlockEntity).find({ order: { height: 'ASC' } })
      ).map(({ height, hash, status }) => ({ height, hash, status })),
      observations: (
        await db
          .getRepository(ObservationEntity)
          .find({ order: { height: 'ASC' } })
      ).map(({ height, requestId, block }) => ({ height, requestId, block })),
    });
    await scanner.registerExtractor({
      getId: () => extractorId,
      initializeData: async () => undefined,
      forkBlock: (blockHash: string) =>
        observations.deleteBlockObservation(blockHash, extractorId),
      hasEventInHeightRange: async () => true,
      createUsedBlocksQuery: () => undefined,
      processTransactions: guardZcashExtraction(
        logger,
        async (_transactions: unknown[], block: BlockInfo) => {
          // Use the actual package's SQLite transaction and duplicate handling.
          const stored = await observations.storeObservations(
            [
              {
                fromChain: 'zcash',
                toChain: 'ergo',
                amount: '100',
                bridgeFee: '1',
                networkFee: '1',
                fromAddress: 'fixture-input',
                toAddress: 'fixture-destination',
                sourceChainTokenId: 'zec',
                targetChainTokenId: 'fixture-token',
                sourceTxId: `tx-${block.hash}`,
                sourceBlockId: block.hash,
                requestId: `request-${block.hash}`,
                rawData: 'fixture',
              },
            ],
            block,
            extractorId,
          );
          if (block.height === 2 && mode === 'crash') {
            process.send?.({ checkpoint: await summary() });
            // Keep the process alive until the parent kills it without db.destroy().
            await new Promise<void>(() => {
              setInterval(() => undefined, 1000);
            });
          }
          if (block.height === 2 && mode === 'fault')
            logger.error('persistent extraction fault');
          return stored;
        },
      ),
    });
    const before = await summary();
    await scanner.update();
    if (mode === 'crash') {
      tip = 3;
      await scanner.update();
      throw new Error(
        'Crash fixture failed to stop at the extraction boundary',
      );
    }
    if (mode === 'reorg') {
      replacement = true;
      await scanner.update();
      const rolledBack = await summary();
      await scanner.update();
      process.send?.({ before, rolledBack, after: await summary() });
    } else {
      process.send?.({ before, after: await summary() });
    }
  } finally {
    await db.destroy();
  }
  process.disconnect?.();
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
    process.disconnect?.();
  });
}
