import * as ergoLib from "ergo-lib-wasm-nodejs";
import { NetworkPrefix } from "ergo-lib-wasm-nodejs";
import config from "config";
import express from "express";
import { Transaction } from "./lock";
import { rosenConfig } from "./rosenConfig";
import { strToUint8Array } from "../utils/utils";

const router = express.Router();

const NETWORK_TYPE: string | undefined = config.get?.('ergo.networkType');
const SECRET_KEY: string | undefined = config.get?.('ergo.watcherSecretKey');

router.get("/lock", async (req, res) => {
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
            res.status(500).send("Network type doesn't set correctly in config file");
            return;
        }
    }
    if (SECRET_KEY === undefined) {
        res.status(500).send("Secret Key doesn't set in config file");
        return;
    }

    const RSNCount = req.query.count;
    if (typeof RSNCount !== "string") {
        res.status(400).send("RSNCount doesn't set");
        return;
    }


    const watcherAddress = ergoLib.SecretKey.dlog_from_bytes(
        strToUint8Array(SECRET_KEY)
    ).get_address().to_base58(networkType);

    const transaction = new Transaction(rosenConfig, watcherAddress, SECRET_KEY);

    if (await transaction.watcherHasLocked()) {
        res.status(400).send("you have locked RSN");
    }

    const transactionId = await transaction.getPermit("100");
    if (transactionId === "") {
        res.status(400).send("Error");
        return;
    }
    res.status(200).json({txid: transactionId});
});


export default router;
