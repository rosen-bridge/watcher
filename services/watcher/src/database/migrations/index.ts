import { WatcherMigration1689672370602 } from './postgres/1689672370602-watcherMigration';
import { WatcherMigration1689672207771 } from './sqlite/1689672207771-watcherMigration';
import { WatcherMigration1691485920917 } from './postgres/1691485920917-watcherMigration';
import { WatcherMigration1692085666831 } from './sqlite/1692085666831-watcherMigration';
import { WatcherMigration1692612522380 } from './postgres/1692612522380-watcherMigration';
import { WatcherMigration1692612814917 } from './sqlite/1692612814917-watcherMigration';
import { WatcherMigration1695193411148 } from './sqlite/1695193411148-watcherMigration';
import { WatcherMigration1695193552642 } from './postgres/1695193552642-watcherMigration';
import { WatcherMigration1695625188757 } from './sqlite/1695625188757-watcherMigration';
import { WatcherMigration1695625331684 } from './postgres/1695625331684-watcherMigration';
import { WatcherMigration1699701960730 } from './sqlite/1699701960730-watcherMigration';
import { WatcherMigration1699702069196 } from './postgres/1699702069196-watcherMigration';

export default {
  sqlite: [
    WatcherMigration1689672207771,
    WatcherMigration1692085666831,
    WatcherMigration1692612814917,
    WatcherMigration1695193411148,
    WatcherMigration1695625188757,
    WatcherMigration1699701960730,
  ],
  postgres: [
    WatcherMigration1689672370602,
    WatcherMigration1691485920917,
    WatcherMigration1692612522380,
    WatcherMigration1695193552642,
    WatcherMigration1695625331684,
    WatcherMigration1699702069196,
  ],
};
