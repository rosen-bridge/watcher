import path from 'path';
import { DataSource } from "typeorm";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const bridgeOrmConfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/bridgeWatcher.sqlite",
    entities: ['src/entities/watcher/bridge/*.ts'],
    migrations: ['src/migrations/watcher/bridge/*.ts'],
    synchronize: false,
    logging: false,
});
