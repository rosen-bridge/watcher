import { Config } from "../config/config";
import { CommitmentCreation } from "../transactions/commitmentCreation";
import { Boxes } from "../ergo/boxes";
import { Transaction } from "../api/Transaction";
import { TransactionUtils, WatcherUtils } from "../utils/utils";

const config = Config.getConfig();
let commitmentCreatorObj: CommitmentCreation

const creationJob = () => {
    commitmentCreatorObj.job().then(() => setTimeout(creationJob, config.commitmentCreationInterval * 1000))
}

export const creation = (watcherUtils: WatcherUtils, txUtils: TransactionUtils, boxes: Boxes, transaction: Transaction) => {
    commitmentCreatorObj = new CommitmentCreation(watcherUtils, txUtils, boxes, transaction)
    creationJob()
}
