import { CommitmentReveal } from '../transactions/commitmentReveal';
import { Boxes } from '../ergo/boxes';
import { TransactionUtils, WatcherUtils } from '../utils/watcherUtils';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';

const logger = loggerFactory(import.meta.url);

let commitmentRevealingObj: CommitmentReveal;

const revealJob = async () => {
  try {
    await commitmentRevealingObj.job();
  } catch (e) {
    logger.warn(`Reveal Job failed with error: ${e.message} - ${e.stack}`);
  }
  setTimeout(revealJob, getConfig().general.commitmentRevealInterval * 1000);
};

export const reveal = (
  watcherUtils: WatcherUtils,
  txUtils: TransactionUtils,
  boxes: Boxes
) => {
  commitmentRevealingObj = new CommitmentReveal(watcherUtils, txUtils, boxes);
  revealJob();
};
