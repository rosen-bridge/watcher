import express from "express";
import { ErgoConfig } from "../config/config";
import { generateSK } from "./ergoUtils";

const router = express.Router();

router.get("/generate", (req, res) => {
    const secretKey = generateSK();
    let ergoConfig: ErgoConfig;
    try {
        ergoConfig = ErgoConfig.getConfig();
    } catch (e) {
        res.status(500).send(e);
        return;
    }
    const address = secretKey.get_address().to_base58(ergoConfig.networkType);
    const secret = Buffer.from(secretKey.to_bytes()).toString('hex');
    res.json({address: address, secret: secret});
});

export default router;
