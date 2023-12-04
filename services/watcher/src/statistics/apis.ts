import { Request, Response, Router } from 'express';
import Statistics from './statistics';

const statisticsRouter = Router();

statisticsRouter.get('', async (req: Request, res: Response) => {
  try {
    const statistics = Statistics.getInstance();
    const ergsAndFee = await statistics.getErgsAndFee();
    const commitmentsCount = await statistics.getCommitmentsCount();
    const eventTriggersCount = await statistics.getEventTriggersCount();
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
    const statistics = Statistics.getInstance();
    const offset = Number(req.query.offset);
    const limit = Number(req.query.limit);
    const commitments = await statistics.getCommitments(offset, limit);
    res.status(200).send(commitments);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

statisticsRouter.get('/eventTriggers', async (req: Request, res: Response) => {
  try {
    const statistics = Statistics.getInstance();
    const offset = Number(req.query.offset);
    const limit = Number(req.query.limit);
    const eventTriggers = await statistics.getEventTriggers(offset, limit);
    res.status(200).send(eventTriggers);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

export { statisticsRouter };
