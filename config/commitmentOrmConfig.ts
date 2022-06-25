import path from 'path';
import { DataSource } from "typeorm";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const commitmentOrmConfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/commitmentWatcher.sqlite",
    entities: ['src/entities/watcher/commitment/*.ts'],
    migrations: ['src/migrations/watcher/commitment/*.ts'],
    synchronize: false,
    logging: false,
});
