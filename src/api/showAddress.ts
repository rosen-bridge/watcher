import express, { Request, Response } from "express";
import { ErgoConfig } from "../config/config";
import { watcherTransaction } from "../index";
import { body, validationResult } from "express-validator";

const addressRouter = express.Router();

addressRouter.get("/show",
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            let ergoConfig: ErgoConfig = ErgoConfig.getConfig();
            let address: string = watcherTransaction.userAddress.to_base58(ergoConfig.networkType);
            res.status(200).json({address: address});
        } catch (e) {
            console.warn(e)
            res.status(500).send({message: e.message});
        }
});

export default addressRouter;
