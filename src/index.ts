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
import * as wasm from "ergo-lib-wasm-nodejs";


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

        const temp = new Transaction(
            rosenConfig,
            ergoConfig.address,
            ergoConfig.secretKey,
            boxesObject,
        );
        // console.log("ready to return",temp)
        return temp;
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
            // initExpress();
            // await delay(10000)
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


// const box = "4JFDEAkEAAQADiCEtdpdKps3QAFVb/1SWSUSoKYy8tywbKgA9fZGLBtTHQQCBAAOIKwMFs7oyu/QgUxVaKnVC+pR/siOirvTrINHuU0FShtlBAIEAA4gpqw4Hm+pmSn9FHezupSZeQp3XpHUwUxaqG6aEY36yFPYBdYB5ManBBrWArFyAdYDtKVzAHIC1gTCsqVzAQDWBctyBNGWgwMBk3ICsXIDr9wMHXIBAXID2QEGPA5j2AHWCIxyBgLtk4MBDoxyBgHkxnIIBBqTwnIIcgSVk3IFcwKWgwIBk4yy22MIsqRzAwBzBAABcwWSo4zHpwGWgwIBk4yy22MIsqRzBgBzBwABcwiTcgXkxqcGDqy8DwFJcoe5oe/2Q3kSd3RKdLfVmLg03GE/LryXLjN2fGGsKwEDGgEgBkxY6jlNQfraB0o8VgoTJGet9MoVEsQJwBTGJcooXpwaCyDQT8k9wVooofDlCw//yU82ADfc7d2vii4lkFqJLNSDeARFcmdvA0FEQQtmcm9tQWRkcmVzcwp0b0FkZHJlc3M0CAAAAAAAAAACCAAAAAAAAAnECAAAAAAAAYagIAA0xE8Mejj4MxkNRBJf+bOg3Z27iROBYBgqkwvFIduVIPamlSmxKn4jJqz/7oOD4MRECPh6hyiG+t9BD+hJgAbTIG50SZFx2CjuUSZtO2UBHPlYr+VRznoNdOX2q6kCmukMDiBHgZ/0LwrDy5LhPRuqopbabUhuhmdv+++/hoKnq0cQMg4RCXL+Rs++D8wKHDZw7PGnAFrdLhLAA7T1tCr5Lj8NAA==";
// const dec = new Uint8Array(Buffer.from(box, 'base64'))
// console.log(wasm.ErgoBox.sigma_parse_bytes(dec).to_json())

