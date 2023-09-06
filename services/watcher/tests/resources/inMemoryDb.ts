import { DataSource } from 'typeorm';
import {
  BoxEntity,
  migrations as addressExtractorMigrations,
} from '@rosen-bridge/address-extractor';
import {
  migrations as observationMigrations,
  ObservationEntity,
} from '@rosen-bridge/observation-extractor';
import {
  BlockEntity,
  migrations as scannerMigrations,
} from '@rosen-bridge/scanner';
import {
  CommitmentEntity,
  EventTriggerEntity,
  PermitEntity,
  migrations as watcherDataExtractorMigrations,
} from '@rosen-bridge/watcher-data-extractor';
import { ObservationStatusEntity } from '../../src/database/entities/observationStatusEntity';
import { TxEntity } from '../../src/database/entities/txEntity';
import migrations from '../../src/database/migrations';
import { TokenEntity } from '../../src/database/entities/tokenEntity';
import { RevenueView } from '../../src/database/entities/revenueView';
import { RevenueEntity } from '../../src/database/entities/revenueEntity';
import { RevenueChartDataView } from '../../src/database/entities/revenueChartDataView';

const createMemoryDatabase = async (): Promise<DataSource> => {
  const entities = [
    BlockEntity,
    BoxEntity,
    ObservationEntity,
    CommitmentEntity,
    EventTriggerEntity,
    PermitEntity,
    ObservationStatusEntity,
    TxEntity,
    TokenEntity,
    RevenueView,
    RevenueEntity,
    RevenueChartDataView,
  ];

  return new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: entities,
    migrations: [
      ...addressExtractorMigrations.sqlite,
      ...observationMigrations.sqlite,
      ...scannerMigrations.sqlite,
      ...watcherDataExtractorMigrations.sqlite,
      ...migrations.sqlite,
    ],
    synchronize: false,
    logging: false,
  })
    .initialize()
    .then(async (dataSource) => {
      await dataSource.runMigrations();
      return dataSource;
    });
};

export { createMemoryDatabase };
