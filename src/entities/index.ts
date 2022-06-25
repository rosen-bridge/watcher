import { BlockEntity } from "./watcher/cardano/BlockEntity";
import { CommitmentEntity } from "./watcher/cardano/CommitmentEntity";
import { ObservationEntity } from "./watcher/cardano/ObservationEntity";
import { BridgeBlockEntity } from "./watcher/bridge/BridgeBlockEntity";
import { ObservedCommitmentEntity } from "./watcher/bridge/ObservedCommitmentEntity";
import { BoxEntity } from "./watcher/bridge/BoxEntity";


export const entities = [BlockEntity, CommitmentEntity, ObservationEntity];
export const commitmentEntities = [BridgeBlockEntity, ObservedCommitmentEntity, BoxEntity];
