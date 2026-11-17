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
import { ObservationStatusEntity } from '../../../src/database/entities/observationStatusEntity';
import { TxEntity } from '../../../src/database/entities/txEntity';
import { TokenEntity } from '../../../src/database/entities/tokenEntity';
import { RevenueEntity } from '../../../src/database/entities/revenueEntity';
import { RevenueView } from '../../../src/database/entities/revenueView';
import { RevenueChartDataView } from '../../../src/database/entities/revenueChartDataView';
import migrations from '../../../src/database/migrations';

/**
 * Reopen a real SQLite database with the production entity and migration set.
 * @param path - Machine-local temporary database file
 * @returns Migrated DataSource whose repository relations are unmocked
 */
export const open = async (path: string): Promise<DataSource> => {
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
