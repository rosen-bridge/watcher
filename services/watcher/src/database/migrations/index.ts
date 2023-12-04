import { WatcherMigration1700710099334 } from './postgres/1700710099334-watcherMigration';
import { WatcherMigration1700641198429 } from './sqlite/1700641198429-watcherMigration';

export default {
  sqlite: [WatcherMigration1700641198429],
  postgres: [WatcherMigration1700710099334],
};
