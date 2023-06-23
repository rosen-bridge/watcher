import { watcherModelMigration1678166758664 } from './postgres/1678166758664-watcherModelMigration';
import { watcherModelMigration1684405318897 } from './postgres/1684405318897-watcherModelMigration';
import { watcherModelMigration1683891493000 } from './postgres/1683891493000-watcherModelMigration';
import { watcherModelMigration1668497303559 } from './sqlite/1668497303559-watcherModelMigration';
import { watcherModelMigration1678171462407 } from './sqlite/1678171462407-watcherModelMigration';
import { watcherModelMigration1684405325176 } from './sqlite/1684405325176-watcherModelMigration';
import { watcherModelMigration1683891492000 } from './sqlite/1683891492000-watcherModelMigration';
import { watcherModelMigration1685285583000 } from './postgres/1685285583000-watcherModelMigration';
import { watcherModelMigration1685285582000 } from './sqlite/1685285582000-watcherModelMigration';
import { watcherModelMigration1687342159694 } from './postgres/1687342159694-watcherModelMigration';
import { watcherModelMigration1687342283693 } from './sqlite/1687342283693-watcherModelMigration';
import { watcherModelMigration1687342218146 } from './postgres/1687342218146-watcherModelMigration';
import { watcherModelMigration1687342318126 } from './sqlite/1687342318126-watcherModelMigration';
import { watcherModelMigration1687342250269 } from './postgres/1687342250269-watcherModelMigration';
import { watcherModelMigration1687342345843 } from './sqlite/1687342345843-watcherModelMigration';

export default {
  sqlite: [
    watcherModelMigration1668497303559,
    watcherModelMigration1678171462407,
    watcherModelMigration1684405325176,
    watcherModelMigration1683891492000,
    watcherModelMigration1685285582000,
    watcherModelMigration1687342283693,
    watcherModelMigration1687342318126,
    watcherModelMigration1687342345843,
  ],
  postgres: [
    watcherModelMigration1678166758664,
    watcherModelMigration1684405318897,
    watcherModelMigration1683891493000,
    watcherModelMigration1685285583000,
    watcherModelMigration1687342159694,
    watcherModelMigration1687342218146,
    watcherModelMigration1687342250269,
  ],
};
