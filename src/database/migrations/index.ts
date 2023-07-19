import { WatcherMigration1689672370602 } from './postgres/1689672370602-watcherMigration';
import { WatcherMigration1689672207771 } from './sqlite/1689672207771-watcherMigration';

export default {
  sqlite: [WatcherMigration1689672207771],
  postgres: [WatcherMigration1689672370602],
};
