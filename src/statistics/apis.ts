import { Request, Response, Router } from "express";
import { watcherStatistics } from "../index";

const statisticsRouter = Router();

statisticsRouter.get("", async (req: Request, res: Response) => {
    try {
        const ergs = await watcherStatistics.getErgs();
        const commitmentsCount = await watcherStatistics.getCommitmentsCount();
        const eventTriggersCount = await watcherStatistics.getEventTriggersCount();
        res.status(200).send(
            {
                ergs: ergs,
                commitmentsCount: commitmentsCount,
                eventTriggersCount: eventTriggersCount,
                fee: ''
            }
        )
    } catch (e) {
        res.status(500).send({message: e.message})
    }
})

statisticsRouter.get("/commitments", async (req: Request, res: Response) => {
    try {
        const offset = Number(req.query.offset);
        const limit = Number(req.query.limit);
        const commitments = await watcherStatistics.getCommitments(offset, limit);
        res.status(200).send(JSON.stringify(commitments))
    } catch (e) {
        res.status(500).send({message: e.message})
    }
})

statisticsRouter.get("/eventTriggers", async (req: Request, res: Response) => {
    try {
        const offset = Number(req.query.offset);
        const limit = Number(req.query.limit);
        const eventTriggers = await watcherStatistics.getEventTriggers(offset, limit);
        res.status(200).send(JSON.stringify(eventTriggers))
    } catch (e) {
        res.status(500).send({message: e.message})
    }
})
