import { DataSource } from "typeorm";

export const ormconfig = new DataSource({
    type: "sqlite",
    database: __dirname + "/../../sqlite/watcher.sqlite",
    entities: [__dirname + "/../src/entities/*{.js,.ts}"],
    migrations: [__dirname + "/../src/migrations/*{.js,.ts}"],
    synchronize: false,
    logging: false,
});

