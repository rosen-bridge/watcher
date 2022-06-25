import * as networkModel from "./watcher/cardano/1656073919399-networkModelMigration";
import * as commitment from "./watcher/commitment/1656149044337-bridgeModelMigration";

export const migrations = [networkModel.networkModelMigration1656073919399];
export const commitmentMigrations = [commitment.bridgeModelMigration1656149044337];
