import "reflect-metadata";
import express from "express";
import generateAddress from "./api/showAddress";
import lockRSN from "./api/permit";
import { Transaction } from "./api/Transaction";
import { ErgoConfig } from "./config/config";
import { rosenConfig } from "./config/rosenConfig";
import { Boxes } from "./ergo/boxes";
import { ErgoNetworkApi } from "./bridge/network/networkApi";
import { NetworkDataBase } from "./models/networkModel";
import { BridgeDataBase } from "./bridge/models/bridgeModel";
import { bridgeOrmConfig } from "../config/bridgeOrmConfig";

export let watcherTransaction: Transaction;
export let boxesObject: Boxes;
export let ergoNetworkApi: ErgoNetworkApi;
export let networkDatabase: NetworkDataBase;
export let bridgeDatabase: BridgeDataBase;

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
        res => {
            watcherTransaction = res;
            initExpress();
        }
    ).catch(e => {
        console.log(e)
    });
}

init();

