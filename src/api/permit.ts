import express from "express";
import { watcherTransaction } from "../index";

const router = express.Router();
router.get("/get", async (req, res) => {
    const RSNCount = req.query.count;
    if (typeof RSNCount !== "string") {
        res.status(400).send("RSNCount doesn't set");
        return;
    }

    let transactionId: string;
    try {
        transactionId = await watcherTransaction.getPermit(RSNCount);
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
        return;
    }
    res.status(200).json({txid: transactionId});
});

router.get("/return", async (req, res) => {
    const RWTCount = req.query.count;
    if (typeof RWTCount !== "string") {
        res.status(400).send("RWTCount doesn't set");
        return;
    }

    let transactionId: string;
    try {
        transactionId = await watcherTransaction.returnPermit(RWTCount);
    } catch (e) {
        console.log(e)

        res.status(400).send(e)
        return;
    }
    res.status(200).json({txid: transactionId});
});

export default router;
