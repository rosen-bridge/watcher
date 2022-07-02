import path from 'path';
import { DataSource } from "typeorm";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const cardanoOrmConfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/cardanoWatcher.sqlite",
    entities: ['src/entities/watcher/network/*.ts'],
    migrations: ['src/migrations/watcher/network/*.ts'],
    synchronize: false,
    logging: false,
});
