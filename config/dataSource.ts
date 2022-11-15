import path from 'path';
import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dataSource = new DataSource({
  type: 'sqlite',
  database: __dirname + '/../sqlite/watcher.sqlite',
  entities: [
    BlockEntity,
    BoxEntity,
    CommitmentEntity,
    EventTriggerEntity,
    ObservationEntity,
    ObservationStatusEntity,
    PermitEntity,
    TxEntity,
  ],
  migrations: [
    ...addressExtractorMigrations,
    ...observationMigrations,
    ...scannerMigrations,
    ...watcherDataExtractorMigrations,
    ...migrations,
  ],
  synchronize: false,
  logging: false,
});
