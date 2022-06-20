import { DataSource } from "typeorm";
import { commitmentEntities } from "../src/entities";
import { commitmentMigrations } from "../src/migrations";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const commitmentOrmConfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/commitmentWatcher.sqlite",
    entities: commitmentEntities,
    migrations: commitmentMigrations,
    synchronize: false,
    logging: false,
});
