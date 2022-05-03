import { DataSource } from "typeorm";
import { entities, commitmentEntities } from "../src/entities";
import { migrations } from "../src/migrations";

export const cardanoOrmConfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/cardanoWatcher.sqlite",
    entities: entities,
    migrations: migrations,
    synchronize: false,
    logging: false,
});

export const commitmentOrmConfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/commitmentWatcher.sqlite",
    entities: commitmentEntities,
    migrations: migrations,
    synchronize: false,
    logging: false,
});
