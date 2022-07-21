import { ErgoConfig } from "./config/config";
import { databaseConnection, networkDatabase } from "./index";
import { TransactionQueue } from "./ergo/transactionQueue";

const ergoConfig = ErgoConfig.getConfig();
let transactionQueue: TransactionQueue

const transactionCheck = () => {
    transactionQueue.job().then(() => setTimeout(transactionCheck, ergoConfig.transactionCheckingInterval * 1000))
}

export const transactionQueueJob = () => {
    transactionQueue = new TransactionQueue(networkDatabase, databaseConnection)
    transactionCheck()
}
