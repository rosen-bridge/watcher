import express, { Request, Response } from "express";
import { ErgoConfig } from "../config/config";
import { watcherTransaction } from "../index";
import { validationResult } from "express-validator";
import { generateSK } from "../utils/utils";

const addressRouter = express.Router();

addressRouter.get("/generate",
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const ergoConfig: ErgoConfig = ErgoConfig.getConfig();
            res.status(200).json(generateSK(ergoConfig));
        } catch (e) {
            console.warn(e)
            res.status(500).send({message: e.message});
        }
});

export default addressRouter;
