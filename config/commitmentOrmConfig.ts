import { DataSource } from "typeorm";
import { commitmentEntities } from "../src/entities";
import { commitmentMigrations } from "../src/migrations";

export const commitmentOrmConfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/commitmentWatcher.sqlite",
    entities: commitmentEntities,
    migrations: commitmentMigrations,
    synchronize: false,
    logging: false,
});
