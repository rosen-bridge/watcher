import { watcherModelMigration1668497303559 } from './sqlite/1668497303559-watcherModelMigration';
import { watcherModelMigration1673270313743 } from './postgres/1673270313743-watcherModelMigration';

export default {
  sqlite: [watcherModelMigration1668497303559],
  postgres: [watcherModelMigration1673270313743],
};
