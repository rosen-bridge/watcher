import "reflect-metadata";
import express from "express";
import generateAddress from "./api/showAddress";
import lockRSN from "./api/permit";
import { Transaction } from "./api/Transaction";
import { ErgoConfig } from "./config/config";
import { rosenConfig } from "./config/rosenConfig";
import { Worker } from "worker_threads";
import { Boxes } from "./ergo/boxes";
import { NetworkDataBase } from "./models/networkModel";
import { BridgeDataBase } from "./bridge/models/bridgeModel";
import { bridgeOrmConfig } from "../config/bridgeOrmConfig";
import { ErgoNetworkApi } from "./bridge/network/networkApi";
import { ergoOrmConfig } from "../config/ergoOrmConfig";
import { cardanoOrmConfig } from "../config/ormconfig";
import { DatabaseConnection } from "./ergo/databaseConnection";

const ergoConfig = ErgoConfig.getConfig();

export let watcherTransaction: Transaction;
export let boxesObject: Boxes;
export let ergoNetworkApi: ErgoNetworkApi;
export let networkDatabase: NetworkDataBase;
export let bridgeDatabase: BridgeDataBase;
export let databaseConnection: DatabaseConnection;
// TODO: Set this based on the scanning network config
export let observationConfirmation: number = 2;

const init = async () => {
    const generateTransactionObject = async (): Promise<Transaction> => {
        const ergoConfig = ErgoConfig.getConfig();

        bridgeDatabase = await BridgeDataBase.init(bridgeOrmConfig);
        boxesObject = new Boxes(bridgeDatabase)
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
        app.use('/address', generateAddress);
        app.use('/permit', lockRSN);

        const port = process.env.PORT || 3000;

        app.listen(port, () => console.log(`app listening on port ${port}`));
    }

    generateTransactionObject().then(
        async (res) => {
            watcherTransaction = res;
            initExpress();
            // Running bridge scanner thread
            const worker = new Worker('./src/bridgeScanner.js')
            // Running network scanner thread
            if(ergoConfig.networkWatcher == "Ergo") {
                // Initializing database
                networkDatabase = await NetworkDataBase.init(ergoOrmConfig)
                // Running Ergo scanner
                const worker = new Worker('./src/ergoScanner.ts')
            } else if(ergoConfig.networkWatcher == "Cardano") {
                // Initializing database
                networkDatabase = await NetworkDataBase.init(cardanoOrmConfig)
                // Running Cardano scanner
                const worker = new Worker('./src/cardanoScanner.ts')
            }

            databaseConnection = new DatabaseConnection(networkDatabase, bridgeDatabase, observationConfirmation)
            // Running commitment creation thread
            new Worker('./src/commitmentCreation.ts')
            // Running trigger event creation thread
            new Worker('./src/commitmentReveal.ts')
        }
    ).catch(e => {
        console.log(e)
    });
}

init().then(() => null);
