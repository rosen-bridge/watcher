import { watcherModelMigration1678166758664 } from './postgres/1678166758664-watcherModelMigration';
import { watcherModelMigration1684405318897 } from './postgres/1684405318897-watcherModelMigration';
import { watcherModelMigration1683891493000 } from './postgres/1683891493000-watcherModelMigration';
import { watcherModelMigration1668497303559 } from './sqlite/1668497303559-watcherModelMigration';
import { watcherModelMigration1678171462407 } from './sqlite/1678171462407-watcherModelMigration';
import { watcherModelMigration1684405325176 } from './sqlite/1684405325176-watcherModelMigration';
import { watcherModelMigration1683891492000 } from './sqlite/1683891492000-watcherModelMigration';
import { watcherModelMigration1685285583000 } from './postgres/1685285583000-watcherModelMigration';
import { watcherModelMigration1685285582000 } from './sqlite/1685285582000-watcherModelMigration';
import { watcherModelMigration1686489592340 } from './postgres/1686489592340-watcherModelMigration';
import { watcherModelMigration1686490574850 } from './sqlite/1686490574850-watcherModelMigration';
import { watcherModelMigration1686842348431 } from './postgres/1686842348431-watcherModelMigration';
import { watcherModelMigration1686842459848 } from './sqlite/1686842459848-watcherModelMigration';
import { watcherModelMigration1687082695463 } from './postgres/1687082695463-watcherModelMigration';
import { watcherModelMigration1687082785210 } from './sqlite/1687082785210-watcherModelMigration';

export default {
  sqlite: [
    watcherModelMigration1668497303559,
    watcherModelMigration1678171462407,
    watcherModelMigration1684405325176,
    watcherModelMigration1683891492000,
    watcherModelMigration1685285582000,
    watcherModelMigration1686490574850,
    watcherModelMigration1686842459848,
    watcherModelMigration1687082785210,
  ],
  postgres: [
    watcherModelMigration1678166758664,
    watcherModelMigration1684405318897,
    watcherModelMigration1683891493000,
    watcherModelMigration1685285583000,
    watcherModelMigration1686489592340,
    watcherModelMigration1686842348431,
    watcherModelMigration1687082695463,
  ],
};
