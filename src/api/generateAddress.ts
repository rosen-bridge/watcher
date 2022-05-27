import * as ergoLib from "ergo-lib-wasm-nodejs";
import { NetworkPrefix, SecretKey } from "ergo-lib-wasm-nodejs";
import config from "config";
import express from "express";

const router = express.Router();

const NETWORK_TYPE: string | undefined = config.get?.('ergo.networkType');

const SK="0e63ebf90bb888862f38b3e1def61707e14ea1775b4003f6f708305550824652";

export const generateSK = (): SecretKey => {
    return ergoLib.SecretKey.random_dlog();
}

router.get("/generate", (req, res) => {
    //TODO: should complete later to save the secret key
    const secretKey = ergoLib.SecretKey.random_dlog();
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
        }
    }
    const address = secretKey.get_address().to_base58(networkType);
    const secret = Buffer.from(secretKey.to_bytes()).toString('hex');
    res.json({address: address, secret: secret});
});

export default router;
