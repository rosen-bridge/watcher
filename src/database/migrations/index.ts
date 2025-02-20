import { WatcherMigration1700710099334 } from './postgres/1700710099334-watcherMigration';
import { WatcherMigration1703244656364 } from './postgres/1703244656364-watcherMigration';
import { WatcherMigration1704105342269 } from './postgres/1704105342269-watcherMigration';
import { WatcherMigration1720424860524 } from './postgres/1720424860524-watcherMigration';
import { WatcherMigration1722549850233 } from './postgres/1722549850233-watcherMigration';
import { WatcherMigration1722867363628 } from './postgres/1722867363628-watcherMigration';
import { WatcherMigration1700641198429 } from './sqlite/1700641198429-watcherMigration';
import { WatcherMigration1703244614956 } from './sqlite/1703244614956-watcherMigration';
import { WatcherMigration1704105040303 } from './sqlite/1704105040303-watcherMigration';
import { WatcherMigration1706610773175 } from './sqlite/1706610773175-watcherMigration';
import { WatcherMigration1706610773177 } from './sqlite/1706610773177-watcherMigration';
import { WatcherMigration1720425345411 } from './sqlite/1720425345411-watcherMigration';
import { WatcherMigration1722597111974 } from './sqlite/1722597111974-watcherMigration';
import { WatcherMigration1722866480590 } from './sqlite/1722866480590-watcherMigration';
import { WatcherMigration1737547742177 } from './sqlite/1737547742177-watcherMigration';
import { WatcherMigration1737547744177 } from './sqlite/1737547744177-watcherMigration';

export default {
  sqlite: [
    WatcherMigration1700641198429,
    WatcherMigration1703244614956,
    WatcherMigration1704105040303,
    WatcherMigration1706610773175,
    WatcherMigration1706610773177,
    WatcherMigration1720425345411,
    WatcherMigration1722597111974,
    WatcherMigration1722866480590,
    WatcherMigration1737547742177,
    WatcherMigration1737547744177,
  ],
  postgres: [
    WatcherMigration1700710099334,
    WatcherMigration1703244656364,
    WatcherMigration1704105342269,
    WatcherMigration1720424860524,
    WatcherMigration1722549850233,
    WatcherMigration1722867363628,
  ],
};
