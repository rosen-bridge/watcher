import { DataSource } from "typeorm";

export const ormconfig = new DataSource({
    type: "sqlite",
    database: "dir/sqlite/watcher.sqlite",
    entities: ["src/entities/*{.js,.ts}"],
    // entities: ["dir/src/entities/*.js"], // production migration
    migrations: ["dir/src/migrations/*.js"],
    synchronize: false,
    logging: false,
})
