import { WatcherMigration1689485728514 } from './postgres/1689485728514-watcherMigration';
import { WatcherMigration1689412456937 } from './sqlite/1689412456937-watcherMigration';

export default {
  sqlite: [WatcherMigration1689412456937],
  postgres: [WatcherMigration1689485728514],
};
