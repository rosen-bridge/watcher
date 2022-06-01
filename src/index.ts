import "reflect-metadata";
import express from "express";
import generateAddress from "./api/generateAddress";
import lockRSN from "./api/permit";
import { Transaction } from "./api/Transaction";
import { initConfig } from "../config/config";
import * as wasm from "ergo-lib-wasm-nodejs";
import { strToUint8Array } from "./utils/utils";
import { rosenConfig } from "./api/rosenConfig";

export let watcherTransaction: Transaction;

const init = async () => {
    const generateTransactionObject = async (): Promise<Transaction> => {
        const config = initConfig();
        const watcherAddress = wasm.SecretKey.dlog_from_bytes(
            strToUint8Array(config.secretKey)
        ).get_address().to_base58(config.networkType);

        return await Transaction.init(
            rosenConfig,
            watcherAddress,
            config.secretKey
        );
    }

    const initExpress = () => {
        const app = express();
        app.use('/address', generateAddress);
        app.use('/permit', lockRSN);

        const port = process.env.PORT || 3000;

        app.listen(port, () => console.log(`app listening on port ${port}`));
    }

    try {
        generateTransactionObject().then(
            res => {
                watcherTransaction = res;
                initExpress();
            }
        );
    } catch (e) {
        throw new Error("Watcher initiate Error with Error: " + e);
    }

}

init();
