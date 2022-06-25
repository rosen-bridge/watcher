import { BlockEntity } from "./watcher/cardano/BlockEntity";
import { CommitmentEntity } from "./watcher/cardano/CommitmentEntity";
import { ObservationEntity } from "./watcher/cardano/ObservationEntity";
import { BridgeBlockEntity } from "./watcher/commitment/BridgeBlockEntity";
import { ObservedCommitmentEntity } from "./watcher/commitment/ObservedCommitmentEntity";
import { BoxEntity } from "./watcher/commitment/BoxEntity";


export const entities = [BlockEntity, CommitmentEntity, ObservationEntity];
export const commitmentEntities = [BridgeBlockEntity, ObservedCommitmentEntity, BoxEntity];
