import { BlockEntity } from "./watcher/cardano/BlockEntity";
import { ObservationEntity } from "./watcher/cardano/ObservationEntity";
import { BridgeBlockEntity } from "./watcher/bridge/BridgeBlockEntity";
import { ObservedCommitmentEntity } from "./watcher/bridge/ObservedCommitmentEntity";
import { BoxEntity } from "./watcher/bridge/BoxEntity";


export const entities = [BlockEntity, ObservationEntity];
export const commitmentEntities = [BridgeBlockEntity, ObservedCommitmentEntity, BoxEntity];
