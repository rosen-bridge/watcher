import { Config } from "../config/config";
import { boxesObject, databaseConnection, watcherTransaction } from "../index";
import { CommitmentCreation } from "../transactions/commitmentCreation";

const config = Config.getConfig();
let commitmentCreatorObj: CommitmentCreation

const creationJob = () => {
    commitmentCreatorObj.job().then(() => setTimeout(creationJob, config.commitmentCreationInterval * 1000))
}

export const creation = () => {
    commitmentCreatorObj = new CommitmentCreation(databaseConnection, boxesObject, watcherTransaction)
    creationJob()
}
