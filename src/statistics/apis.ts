import { Request, Response, Router } from 'express';
import { watcherStatistics } from '../index';

const statisticsRouter = Router();

statisticsRouter.get('', async (req: Request, res: Response) => {
  try {
    const ergsAndFee = await watcherStatistics.getErgsAndFee();
    const commitmentsCount = await watcherStatistics.getCommitmentsCount();
    const eventTriggersCount = await watcherStatistics.getEventTriggersCount();
    const fee: { [token: string]: string } = {};
    for (const key in ergsAndFee.tokens) {
      fee[key] = ergsAndFee.tokens[key].toString();
    }
    res.status(200).send({
      ergs: ergsAndFee.ergs.toString(),
      commitmentsCount: commitmentsCount,
      eventTriggersCount: eventTriggersCount,
      fee: fee,
    });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

statisticsRouter.get('/commitments', async (req: Request, res: Response) => {
  try {
    const offset = Number(req.query.offset);
    const limit = Number(req.query.limit);
    const commitments = await watcherStatistics.getCommitments(offset, limit);
    res.status(200).send(JSON.stringify(commitments));
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

statisticsRouter.get('/eventTriggers', async (req: Request, res: Response) => {
  try {
    const offset = Number(req.query.offset);
    const limit = Number(req.query.limit);
    const eventTriggers = await watcherStatistics.getEventTriggers(
      offset,
      limit
    );
    res.status(200).send(JSON.stringify(eventTriggers));
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

export { statisticsRouter };
