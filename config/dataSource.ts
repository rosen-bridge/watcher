import { DataSource } from 'typeorm';
import { getConfig } from '../src/config/config';
import {
  BoxEntity,
  migrations as addressExtractorMigrations,
} from '@rosen-bridge/address-extractor';
import {
  ObservationEntity,
  migrations as observationMigrations,
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

import { ObservationStatusEntity } from '../src/database/entities/observationStatusEntity';
import { TxEntity } from '../src/database/entities/txEntity';

import migrations from '../src/database/migrations/watcher';

const dbEntities = [
  BlockEntity,
  BoxEntity,
  CommitmentEntity,
  EventTriggerEntity,
  ObservationEntity,
  ObservationStatusEntity,
  PermitEntity,
  TxEntity,
];

let dataSource: DataSource;
if (getConfig().database.type === 'sqlite') {
  dataSource = new DataSource({
    type: 'sqlite',
    database: getConfig().database.path,
    entities: dbEntities,
    migrations: [
      ...addressExtractorMigrations.sqlite,
      ...observationMigrations.sqlite,
      ...scannerMigrations.sqlite,
      ...watcherDataExtractorMigrations.sqlite,
      ...migrations.sqlite,
    ],
    synchronize: false,
    logging: false,
  });
} else {
  dataSource = new DataSource({
    type: 'postgres',
    host: getConfig().database.host,
    port: getConfig().database.port,
    username: getConfig().database.user,
    password: getConfig().database.password,
    database: getConfig().database.name,
    entities: dbEntities,
    migrations: [
      ...addressExtractorMigrations.postgres,
      ...observationMigrations.postgres,
      ...scannerMigrations.postgres,
      ...watcherDataExtractorMigrations.postgres,
      ...migrations.postgres,
    ],
    synchronize: false,
    logging: false,
  });
}

export { dataSource };
