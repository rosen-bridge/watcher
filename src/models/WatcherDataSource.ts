import { DataSource } from "typeorm";
import { ObservationEntity } from "../entity/ObservationEntity";
import { BlockEntity } from "../entity/BlockEntity";
import { CommitmentEntity } from "../entity/CommitmentEntity";

export const WatcherDataSource = new DataSource({
    type: "sqlite",
    // host: "localhost",
    // port: 5432,
    // username: "postgres",
    // password: "pass",
    // database: "postgres",
    database: __dirname + "/../../sqlite/watcher.sqlite",
    entities: [ObservationEntity, BlockEntity, CommitmentEntity],
    synchronize: true,
    logging: false,
})

// WatcherDataSource.initialize()
//     .then(() => {
//         console.log("without error")
//     })
//     .catch((error) => {console.log("error");console.log(error)})
