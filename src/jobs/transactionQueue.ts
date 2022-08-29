import { Config } from "../config/config";
import { TransactionQueue } from "../ergo/transactionQueue";
import { WatcherDataBase } from "../database/models/watcherModel";
import { WatcherUtils } from "../utils/watcherUtils";

const config = Config.getConfig();
let transactionQueue: TransactionQueue

const transactionCheck = () => {
    transactionQueue.job().then(() => setTimeout(transactionCheck, config.transactionCheckingInterval * 1000))
}

export const transactionQueueJob = (database: WatcherDataBase, dbConnection: WatcherUtils) => {
    transactionQueue = new TransactionQueue(database, dbConnection)
    transactionCheck()
}
