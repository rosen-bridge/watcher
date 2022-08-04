import { Request, Response, Router } from "express";
import { watcherTransaction } from "../index";
import { ApiResponse } from "./Transaction";
import { body, validationResult } from "express-validator";

const permitRouter = Router();
permitRouter.post("",
    body("count")
        .notEmpty().withMessage("key count is required!")
        .isString(),
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const RSNCount = req.body.count;
            const response: ApiResponse = await watcherTransaction.getPermit(BigInt(RSNCount));
            if (response.status === 200) {
                res.status(200).send({txId: response.response})
            } else {
                res.status(response.status).send({message: response.response})
            }
        } catch (e) {
            console.log(e)
            res.status(500).send({message: e.message})
        }
});

permitRouter.post("/return",
    body("count")
        .notEmpty().withMessage("key count is required!")
        .isString(),
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const RWTCount = req.body.count;
            const response: ApiResponse = await watcherTransaction.returnPermit(BigInt(RWTCount));
            if (response.status === 200) {
                res.status(200).send({txId: response.response})
            } else {
                res.status(response.status).send({message: response.response})
            }
        } catch (e) {
            console.log(e)
            res.status(500).send({message: e.message})
        }
});

export default permitRouter;
