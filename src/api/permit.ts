import express from "express";
import { watcherTransaction } from "../index";
import { ApiError, ApiResponse } from "./Transaction";

const router = express.Router();
router.get("/get", async (req, res) => {
    const RSNCount = req.query.count;
    if (typeof RSNCount !== "string") {
        res.status(400).send({message: "RSNCount doesn't set"});
        return;
    }
    let response: ApiResponse | ApiError;
    try {
        response = await watcherTransaction.getPermit(RSNCount);
        if ("txId" in response) {
            res.status(200).send(response)
        } else {
            res.status(response.code).send(response)
        }
    } catch (e) {
        console.log(e)
        res.status(500).send({message: e})
    }
});

router.get("/return", async (req, res) => {
    const RWTCount = req.query.count;
    if (typeof RWTCount !== "string") {
        res.status(400).send({message: "RWTCount doesn't set"});
        return;
    }
    let response: ApiResponse | ApiError;
    try {
        response = await watcherTransaction.returnPermit(RWTCount);
        if ("txId" in response) {
            res.status(200).send(response)
        } else {
            res.status(response.code).send(response)
        }
    } catch (e) {
        console.log(e)
        res.status(500).send({message: e})
    }
});

export default router;
