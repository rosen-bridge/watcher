import path from 'path';
import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';

import { BoxEntity } from '@rosen-bridge/address-extractor';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { BlockEntity } from '@rosen-bridge/scanner';
import {
  CommitmentEntity,
  EventTriggerEntity,
  PermitEntity,
} from '@rosen-bridge/watcher-data-extractor';

import { ObservationStatusEntity } from '../src/database/entities/observationStatusEntity';
import { TxEntity } from '../src/database/entities/txEntity';

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
  migrations: ['../src/database/migrations/watcher/*.ts'],
  synchronize: false,
  logging: false,
});
