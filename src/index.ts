import "reflect-metadata";
import express, { Router } from "express";
import addressRouter from "./api/showAddress";
import permitRouter from "./api/permit";
import { Transaction } from "./api/Transaction";
import { Config } from "./config/config";
import { rosenConfig } from "./config/rosenConfig";
import { Boxes } from "./ergo/boxes";
import { WatcherDataBase } from "./database/models/watcherModel";
import { dataSource } from "../config/dataSource";
import { DatabaseConnection } from "./database/databaseConnection";
import { scannerInit } from "./jobs/scanner";
import { creation } from "./jobs/commitmentCreation";
import { reveal } from "./jobs/commitmetnReveal";
import { transactionQueueJob } from "./jobs/transactionQueue";
import { delay } from "./utils/utils";

const config = Config.getConfig();


export let watcherTransaction: Transaction;
export let boxesObject: Boxes;
export let watcherDatabase: WatcherDataBase;
export let databaseConnection: DatabaseConnection;

const init = async () => {
    const generateTransactionObject = async (): Promise<Transaction> => {

        await dataSource.initialize();
        await dataSource.runMigrations();
        watcherDatabase = new WatcherDataBase(dataSource)
        boxesObject = new Boxes(rosenConfig, watcherDatabase)

        return new Transaction(
            rosenConfig,
            config.address,
            config.secretKey,
            boxesObject,
        );
    }

    const initExpress = () => {
        const app = express();
        app.use(express.json())

        const router = Router();
        router.use('/address', addressRouter);
        router.use('/permit', permitRouter);

        app.use(router)
        const port = process.env.PORT || 3000;

        app.listen(port, () => console.log(`app listening on port ${port}`));
    }

    generateTransactionObject().then(
        async (res) => {
            watcherTransaction = res;
            initExpress();
            // Initializing database
            watcherDatabase = new WatcherDataBase(dataSource)
            // Running network scanner thread
            scannerInit()

            await delay(10000)
            databaseConnection = new DatabaseConnection(
                watcherDatabase,
                watcherTransaction,
                config.observationConfirmation,
                config.observationValidThreshold
            )
            // Running transaction checking thread
            transactionQueueJob()
            // Running commitment creation thread
            creation()
            // Running trigger event creation thread
            reveal()
        }
    ).catch(e => {
        console.log(e)
    });
}

if (process.env.NODE_ENV === undefined || process.env.NODE_ENV !== "test") {
    init().then(() => null);
}
