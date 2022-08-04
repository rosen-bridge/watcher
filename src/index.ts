import "reflect-metadata";
import express, { Router } from "express";
import addressRouter from "./api/showAddress";
import permitRouter from "./api/permit";
import { Transaction } from "./api/Transaction";
import { ErgoConfig } from "./config/config";
import { rosenConfig } from "./config/rosenConfig";
import { Boxes } from "./ergo/boxes";
import { NetworkDataBase } from "./models/networkModel";
import { BridgeDataBase } from "./bridge/models/bridgeModel";
import { bridgeOrmConfig } from "../config/bridgeOrmConfig";
import { ErgoNetworkApi } from "./bridge/network/networkApi";
import { ergoOrmConfig } from "../config/ergoOrmConfig";
import { cardanoOrmConfig } from "../config/ormconfig";
import { DatabaseConnection } from "./ergo/databaseConnection";
import { bridgeScanner } from "./bridgeScanner";
import { ergoScanner } from "./ergoScanner";
import { cardanoScanner } from "./cardanoScanner";
import { creation } from "./commitmentCreation";
import { reveal } from "./commitmetnReveal";
import { transactionQueueJob } from "./transactionQueue";
import { delay } from "./utils/utils";

const ergoConfig = ErgoConfig.getConfig();


export let watcherTransaction: Transaction;
export let boxesObject: Boxes;
export let ergoNetworkApi: ErgoNetworkApi;
export let networkDatabase: NetworkDataBase;
export let bridgeDatabase: BridgeDataBase;
export let databaseConnection: DatabaseConnection;


const init = async () => {
    const generateTransactionObject = async (): Promise<Transaction> => {
        const ergoConfig = ErgoConfig.getConfig();

        bridgeDatabase = await BridgeDataBase.init(bridgeOrmConfig);
        boxesObject = new Boxes(rosenConfig, bridgeDatabase)
        ergoNetworkApi = new ErgoNetworkApi();
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
            // Running bridge scanner thread
            bridgeScanner()
            // Running network scanner thread
            if (ergoConfig.networkWatcher == "Ergo") {
                // Initializing database
                networkDatabase = await NetworkDataBase.init(ergoOrmConfig)
                // Running Ergo scanner
                ergoScanner()
            } else if (ergoConfig.networkWatcher == "Cardano") {
                // Initializing database
                networkDatabase = await NetworkDataBase.init(cardanoOrmConfig)
                // Running Cardano scanner
                cardanoScanner()
            }

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
