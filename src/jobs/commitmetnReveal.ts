import { Config } from '../config/config';
import { CommitmentReveal } from '../transactions/commitmentReveal';
import { Boxes } from '../ergo/boxes';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { logger } from '../log/Logger';

const config = Config.getConfig();
let commitmentRevealingObj: CommitmentReveal;

const revealJob = async () => {
  try {
    await commitmentRevealingObj.job();
    setTimeout(revealJob, config.commitmentRevealInterval * 1000);
  } catch (e) {
    logger.warn('Reveal Job failed with error:');
    console.log(e.message);
    setTimeout(revealJob, config.commitmentRevealInterval * 1000);
  }
};

export const reveal = (
  watcherUtils: WatcherUtils,
  txUtils: TransactionUtils,
  boxes: Boxes
) => {
  commitmentRevealingObj = new CommitmentReveal(watcherUtils, txUtils, boxes);
  revealJob();
};
