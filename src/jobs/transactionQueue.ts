import { Config } from "../config/config";
import { databaseConnection, watcherDatabase } from "../index";
import { TransactionQueue } from "../ergo/transactionQueue";

const config = Config.getConfig();
let transactionQueue: TransactionQueue

const transactionCheck = () => {
    transactionQueue.job().then(() => setTimeout(transactionCheck, config.transactionCheckingInterval * 1000))
}

export const transactionQueueJob = () => {
    transactionQueue = new TransactionQueue(watcherDatabase, databaseConnection)
    transactionCheck()
}
