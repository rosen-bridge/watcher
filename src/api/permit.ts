import * as ergoLib from "ergo-lib-wasm-nodejs";
import { NetworkPrefix } from "ergo-lib-wasm-nodejs";
import config from "config";
import express, { Response } from "express";
import { Transaction } from "./Transaction";
import { rosenConfig } from "./rosenConfig";
import { strToUint8Array } from "../utils/utils";

const router = express.Router();

const NETWORK_TYPE: string | undefined = config.get?.('ergo.networkType');
const SECRET_KEY: string | undefined = config.get?.('ergo.watcherSecretKey');

const checkConfigFile = (): Transaction => {
    let networkType: NetworkPrefix = ergoLib.NetworkPrefix.Testnet;
    switch (NETWORK_TYPE) {
        case "Mainnet": {
            networkType = ergoLib.NetworkPrefix.Mainnet;
            break;
        }
        case "Testnet": {
            break;
        }
        default: {
            throw new Error("Network type doesn't set correctly in config file")
        }
    }
    if (SECRET_KEY === undefined) {
        throw new Error("Secret key doesn't set in config file")
    }

    const watcherAddress = ergoLib.SecretKey.dlog_from_bytes(
        strToUint8Array(SECRET_KEY)
    ).get_address().to_base58(networkType);

    console.log("watcher address is ", watcherAddress.toString());

    return new Transaction(rosenConfig, watcherAddress, SECRET_KEY);

}

router.get("/get", async (req, res) => {
    const RSNCount = req.query.count;
    if (typeof RSNCount !== "string") {
        res.status(400).send("RSNCount doesn't set");
        return;
    }

    let transaction: Transaction;
    try {
        transaction = checkConfigFile();
    } catch (e) {
        res.status(500).send(e);
        return;
    }

    if (await transaction.watcherHasLocked()) {
        res.status(400).send("you have locked RSN");
        return;
    }

    let transactionId: string;
    try {
        transactionId = await transaction.getPermit(RSNCount);
    } catch (e) {
        res.status(400).send(e)
        return;
    }
    res.status(200).json({txid: transactionId});
});

router.get("/return", async (req, res) => {

    let transaction: Transaction;
    try {
        transaction = checkConfigFile();
    } catch (e) {
        res.status(500).send(e);
        return;
    }

    if (!await transaction.watcherHasLocked()) {
        res.status(400).send("you have not locked any RSN");
        return;
    }

    let transactionId: string;
    try {
        transactionId = await transaction.returnPermit();
    } catch (e) {
        res.status(400).send(e)
        return;
    }
    res.status(200).json({txid: transactionId});
});

export default router;
