import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';
import { watcherDatabase } from '../init';
import { decodeSerializedBox } from '../ergo/utils';

const logger = loggerFactory(import.meta.url);

/**
 * Fetches revenue details and stores in the database
 */
export const revenueJobFunction = async () => {
  const unsavedRevenues = await watcherDatabase.getUnsavedRevenueIds();
  if (unsavedRevenues.length === 0) {
    return;
  }
  const newPermits = await watcherDatabase.getPermitsById(unsavedRevenues);
  logger.debug(`Revenue Job: ${newPermits.length} new permits found`);
  // store permits info
  for (let i = 0; i < newPermits.length; i++) {
    const permitBox = decodeSerializedBox(newPermits[i].boxSerialized);

    // save tokens as revenues
    const boxTokens = permitBox.tokens();
    for (let j = 0; j < boxTokens.len(); j++) {
      const token = boxTokens.get(j);
      await watcherDatabase.storeRevenue(
        token.id().to_str(),
        token.amount().as_i64().to_str(),
        newPermits[i]
      );
    }

    // save ergs as revenue
    await watcherDatabase.storeRevenue(
      'ERG',
      permitBox.value().as_i64().to_str(),
      newPermits[i]
    );
  }
};

/**
 * Runs the job of storing revenue details
 */
export const revenueJob = async () => {
  try {
    await revenueJobFunction();
  } catch (e) {
    logger.warn(`Revenue Job failed with error: ${e.message} - ${e.stack}`);
  }

  setTimeout(revenueJob, getConfig().general.revenueInterval * 1000);
};
