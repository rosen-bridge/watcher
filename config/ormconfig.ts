import { DataSource } from "typeorm";

export const ormconfig = new DataSource({
    type: "sqlite",
    database: "dir/sqlite/watcher.sqlite",
    entities: ["dir/src/entities/*.js"],
    migrations: ["dir/src/migrations/*.js"],
    synchronize: false,
    logging: false,
})
