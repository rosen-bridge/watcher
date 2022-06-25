import * as networkModel from "./watcher/cardano/1656073919399-networkModelMigration";
import * as commitment from "./watcher/bridge/1656151359971-bridgeModelMigration";

export const migrations = [networkModel.networkModelMigration1656073919399];
export const bridgeMigrations = [commitment.bridgeModelMigration1656151359971];
