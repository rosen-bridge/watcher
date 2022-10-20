import { Request, Response, Router } from 'express';
import { watcherStatistics } from '../index';
import { fillORM, loadDataBase } from '../../tests/database/watcherDatabase';
import Statistics from './statistics';

const statisticsRouter = Router();

/***
 * getting watcherStatistics object when in test environment it uses mocked object
 */
const getWatcherStatistics = async () => {
  if (process.env.NODE_ENV === 'test') {
    const ORM = await loadDataBase('Statistics');
    const DB = ORM.DB;
    return Statistics.getInstance(DB, 'WIDStatistics');
  } else {
    return watcherStatistics;
  }
};

statisticsRouter.get('', async (req: Request, res: Response) => {
  try {
    const Statistics = await getWatcherStatistics();
    const ergsAndFee = await Statistics.getErgsAndFee();
    const commitmentsCount = await Statistics.getCommitmentsCount();
    const eventTriggersCount = await Statistics.getEventTriggersCount();
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
    const Statistics = await getWatcherStatistics();
    const offset = Number(req.query.offset);
    const limit = Number(req.query.limit);
    const commitments = await Statistics.getCommitments(offset, limit);
    res.status(200).send(commitments);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

statisticsRouter.get('/eventTriggers', async (req: Request, res: Response) => {
  try {
    const Statistics = await getWatcherStatistics();
    const offset = Number(req.query.offset);
    const limit = Number(req.query.limit);
    const eventTriggers = await Statistics.getEventTriggers(offset, limit);
    res.status(200).send(eventTriggers);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

export { statisticsRouter };
