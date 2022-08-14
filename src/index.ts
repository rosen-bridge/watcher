import "reflect-metadata";
import express, { Router } from "express";
import addressRouter from "./api/showAddress";
import permitRouter from "./api/permit";
import { Transaction } from "./api/Transaction";
import { Config } from "./config/config";
import { rosenConfig } from "./config/rosenConfig";
import { Boxes } from "./ergo/boxes";
import { NetworkDataBase } from "./database/models/networkModel";
import { BridgeDataBase } from "./database/models/bridgeModel";
import { dataSource } from "../config/dataSource";
import { DatabaseConnection } from "./database/databaseConnection";
import { scannerInit } from "./jobs/Scanner";
import { creation } from "./jobs/commitmentCreation";
import { reveal } from "./jobs/commitmetnReveal";
import { transactionQueueJob } from "./jobs/transactionQueue";
import { delay } from "./utils/utils";
import { ErgoScanner } from "@rosen-bridge/scanner";

const ergoConfig = Config.getConfig();


export let watcherTransaction: Transaction;
export let boxesObject: Boxes;
export let networkDatabase: NetworkDataBase;
export let bridgeDatabase: BridgeDataBase;
export let databaseConnection: DatabaseConnection;
export let ergoScanner: ErgoScanner

const init = async () => {
    const generateTransactionObject = async (): Promise<Transaction> => {
        const ergoConfig = Config.getConfig();

        await dataSource.initialize();
        await dataSource.runMigrations();
        bridgeDatabase = new BridgeDataBase(dataSource)
        boxesObject = new Boxes(rosenConfig, bridgeDatabase)
        return new Transaction(
            rosenConfig,
            ergoConfig.address,
            ergoConfig.secretKey,
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
            await delay(10000)
            // Initializing database
            networkDatabase = new NetworkDataBase(dataSource)
            // Running network scanner thread
            scannerInit(watcherTransaction.watcherWID)

            await delay(30000)
            databaseConnection = new DatabaseConnection(networkDatabase, bridgeDatabase, ergoConfig.observationConfirmation, ergoConfig.observationValidThreshold)
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

init().then(() => null);

