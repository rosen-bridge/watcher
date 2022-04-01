import { DataSource } from "typeorm";
import { Observation } from "./Observation";
import { BlockEntity } from "./BlockEntity";

export const WatcherDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "pass",
    database: "postgres",
    entities: [__dirname+'/models/*.entity.js'],
    synchronize: true,
    logging: true,
})

