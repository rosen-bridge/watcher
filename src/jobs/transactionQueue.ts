import { Config } from "../config/config";
import { databaseConnection, networkDatabase } from "../index";
import { TransactionQueue } from "../ergo/transactionQueue";

const ergoConfig = Config.getConfig();
let transactionQueue: TransactionQueue

const transactionCheck = () => {
    transactionQueue.job().then(() => setTimeout(transactionCheck, ergoConfig.transactionCheckingInterval * 1000))
}

export const transactionQueueJob = () => {
    transactionQueue = new TransactionQueue(networkDatabase, databaseConnection)
    transactionCheck()
}
