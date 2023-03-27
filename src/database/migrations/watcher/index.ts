import { watcherModelMigration1678166758664 } from './postgres/1678166758664-watcherModelMigration';
import { watcherModelMigration1668497303559 } from './sqlite/1668497303559-watcherModelMigration';
import { watcherModelMigration1678171462407 } from './sqlite/1678171462407-watcherModelMigration';

export default {
  sqlite: [
    watcherModelMigration1668497303559,
    watcherModelMigration1678171462407,
  ],
  postgres: [watcherModelMigration1678166758664],
};
