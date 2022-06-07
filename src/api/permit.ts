import express from "express";
import { watcherTransaction } from "../index";
import { ApiError, ApiResponse } from "./Transaction";

const router = express.Router();
router.get("/get", async (req, res) => {
    const RSNCount = req.query.count;
    if (typeof RSNCount !== "string") {
        res.status(400).send({message: "RSNCount doesn't set", code: 500});
        return;
    }
    let transactionId: ApiResponse | ApiError;
    try {
        transactionId = await watcherTransaction.getPermit(RSNCount);
    } catch (e) {
        console.log(e)
        res.status(500).send({message: e, code: 500})
        return;
    }
    const responseCode = ("txId" in transactionId ? 200 : 500);
    return res.status(responseCode).json(transactionId);
});

router.get("/return", async (req, res) => {
    const RWTCount = req.query.count;
    if (typeof RWTCount !== "string") {
        res.status(400).send({message: "RWTCount doesn't set", code: 500});
        return;
    }

    let transactionId: ApiResponse | ApiError;
    try {
        transactionId = await watcherTransaction.returnPermit(RWTCount);
    } catch (e) {
        console.log(e)
        res.status(500).send({message: e, code: 500})
        return;
    }
    const responseCode = ("txId" in transactionId ? 200 : 500);
    return res.status(responseCode).json(transactionId);
});

export default router;
