import { Config } from "../config/config";
import { boxesObject, databaseConnection, watcherTransaction } from "../index";
import { CommitmentCreation } from "../transactions/commitmentCreation";

const ergoConfig = Config.getConfig();
let commitmentCreatorObj: CommitmentCreation

const creationJob = () => {
    commitmentCreatorObj.job().then(() => setTimeout(creationJob, ergoConfig.commitmentCreationInterval * 1000))
}

export const creation = () => {
    commitmentCreatorObj = new CommitmentCreation(databaseConnection, boxesObject, watcherTransaction)
    creationJob()
}
