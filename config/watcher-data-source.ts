import { DataSource } from "typeorm";
import { ObservationEntity } from "../src/entities/ObservationEntity";
import { BlockEntity } from "../src/entities/BlockEntity";
import { CommitmentEntity } from "../src/entities/CommitmentEntity";

export const WatcherDataSource = new DataSource({
    type: "sqlite",
    database: "../sqlite/watcher.sqlite",
    entities: [ObservationEntity, BlockEntity, CommitmentEntity],
    synchronize: true,
    logging: false,
})

