import { DataSource } from "typeorm";

export const WatcherDataSource = new DataSource({
    type: "sqlite",
    database: "../sqlite/watcher.sqlite",
    entities: ["../src/entities/*.ts"],
    synchronize: false,
    logging: true,
})
