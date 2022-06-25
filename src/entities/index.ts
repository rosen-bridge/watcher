import { BlockEntity } from "./watcher/cardano/BlockEntity";
import { CommitmentEntity } from "./watcher/cardano/CommitmentEntity";
import { ObservationEntity } from "./watcher/cardano/ObservationEntity";
import { CBlockEntity } from "./watcher/commitment/CBlockEntity";
import { ObservedCommitmentEntity } from "./watcher/commitment/ObservedCommitmentEntity";

export const entities = [BlockEntity, CommitmentEntity, ObservationEntity];
export const commitmentEntities = [CBlockEntity, ObservedCommitmentEntity];
