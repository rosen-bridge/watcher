import { DataSource } from "typeorm";
import { entities } from "../src/entities";
import { migrations } from "../src/migrations";

export const ormconfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/watcher.sqlite",
    entities: entities,
    migrations: migrations,
    synchronize: false,
    logging: false,
});
