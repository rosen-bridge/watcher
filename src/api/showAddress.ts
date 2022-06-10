import express from "express";
import { ErgoConfig } from "../config/config";
import { watcherTransaction } from "../index";

const router = express.Router();

router.get("/show", (req, res) => {
    let address: string;
    let ergoConfig: ErgoConfig;
    try {
        ergoConfig = ErgoConfig.getConfig();
        address = watcherTransaction.userAddress.to_base58(ergoConfig.networkType);
    } catch (e) {
        res.status(500).send({message: e});
        return;
    }
    res.status(200).json({address: address});
});

export default router;
