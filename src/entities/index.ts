import { BlockEntity } from "./watcher/network/BlockEntity";
import { ObservationEntity } from "./watcher/network/ObservationEntity";
import { BridgeBlockEntity } from "./watcher/bridge/BridgeBlockEntity";
import { ObservedCommitmentEntity } from "./watcher/bridge/ObservedCommitmentEntity";
import { BoxEntity } from "./watcher/bridge/BoxEntity";


export const networkEntities = [BlockEntity, ObservationEntity];
export const bridgeEntities = [BridgeBlockEntity, ObservedCommitmentEntity, BoxEntity];
