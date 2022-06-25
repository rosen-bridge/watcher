import {commitmentModelMigration1656074458609} from "./watcher/commitment/1656074458609-commitmentModelMigration";
import {networkModelMigration1656073919399} from "./watcher/cardano/1656073919399-networkModelMigration";

export const migrations = [networkModelMigration1656073919399];
export const commitmentMigrations = [commitmentModelMigration1656074458609];
