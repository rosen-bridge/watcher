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
  ExtractorStatusEntity,
  migrations as scannerMigrations,
} from '@rosen-bridge/scanner';
import {
  CommitmentEntity,
  EventTriggerEntity,
  migrations as watcherDataExtractorMigrations,
  PermitEntity,
  CollateralEntity,
} from '@rosen-bridge/watcher-data-extractor';
import { DataSource } from '@rosen-bridge/extended-typeorm';
import { getConfig } from '../src/config/config';

import { ObservationStatusEntity } from '../src/database/entities/observationStatusEntity';
import { TxEntity } from '../src/database/entities/txEntity';
import { TokenEntity } from '../src/database/entities/tokenEntity';
import { RevenueView } from '../src/database/entities/revenueView';
import { RevenueEntity } from '../src/database/entities/revenueEntity';
import { RevenueChartDataView } from '../src/database/entities/revenueChartDataView';
import migrations from '../src/database/migrations';

const dbType = getConfig().database.type as keyof typeof migrations;
const dbConfigs = {
  entities: [
    BlockEntity,
    BoxEntity,
    CommitmentEntity,
    EventTriggerEntity,
    PermitEntity,
    CollateralEntity,
    ObservationEntity,
    ExtractorStatusEntity,
    TokenEntity,
    TxEntity,
    ObservationStatusEntity,
    RevenueView,
    RevenueEntity,
    RevenueChartDataView,
  ],
  migrations: [
    ...addressExtractorMigrations[dbType],
    ...observationMigrations[dbType],
    ...scannerMigrations[dbType],
    ...watcherDataExtractorMigrations[dbType],
    ...migrations[dbType],
  ],
  synchronize: false,
  logging: false,
};
let dataSource: DataSource;
if (getConfig().database.type === 'sqlite') {
  dataSource = new DataSource({
    type: 'sqlite',
    database: getConfig().database.path,
    ...dbConfigs,
  });
} else {
  dataSource = new DataSource({
    type: 'postgres',
    host: getConfig().database.host,
    port: getConfig().database.port,
    username: getConfig().database.user,
    password: getConfig().database.password,
    database: getConfig().database.name,
    ...dbConfigs,
  });
}

export { dataSource };
