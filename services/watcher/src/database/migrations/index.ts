import { WatcherMigration1700710099334 } from './postgres/1700710099334-watcherMigration';
import { WatcherMigration1703244656364 } from './postgres/1703244656364-watcherMigration';
import { WatcherMigration1700641198429 } from './sqlite/1700641198429-watcherMigration';
import { WatcherMigration1703244614956 } from './sqlite/1703244614956-watcherMigration';

export default {
  sqlite: [WatcherMigration1700641198429, WatcherMigration1703244614956],
  postgres: [WatcherMigration1700710099334, WatcherMigration1703244656364],
};
