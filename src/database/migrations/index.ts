import { WatcherMigration1689672370602 } from './postgres/1689672370602-watcherMigration';
import { WatcherMigration1689672207771 } from './sqlite/1689672207771-watcherMigration';
import { WatcherMigration1691485920917 } from './postgres/1691485920917-watcherMigration';
import { WatcherMigration1692085666831 } from './sqlite/1692085666831-watcherMigration';
import { WatcherMigration1692612522380 } from './postgres/1692612522380-watcherMigration';
import { WatcherMigration1692612814917 } from './sqlite/1692612814917-watcherMigration';

export default {
  sqlite: [
    WatcherMigration1689672207771,
    WatcherMigration1692085666831,
    WatcherMigration1692612814917,
  ],
  postgres: [
    WatcherMigration1689672370602,
    WatcherMigration1691485920917,
    WatcherMigration1692612522380,
  ],
};
