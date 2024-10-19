import { watcherDatabase } from '../init';
import { decodeSerializedBox, ErgoUtils } from '../ergo/utils';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { getConfig } from '../config/config';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { ERGO_CHAIN_NAME } from '../config/constants';

const logger = WinstonLogger.getInstance().getLogger(import.meta.url);
let initialized = false;

/**
 * Fetches token names of the new UTXOs
 * @param checkedBoxIds
 * @returns updated list of UTXO ids
 */
export const tokenNameJobFunction = async (
  checkedBoxIds: string[]
): Promise<string[]> => {
  // remove spent boxes from checkedBoxIds
  const validCheckedBoxIds = (
    await watcherDatabase.getUnspentBoxesByBoxIds(checkedBoxIds)
  ).map((box) => box.boxId);

  // retrieve new unspent boxes
  const newUTXOs = await watcherDatabase.getUnspentBoxesByBoxIds(
    validCheckedBoxIds,
    true
  );
  const newErgoBoxes = newUTXOs.map((box) =>
    decodeSerializedBox(box.serialized)
  );
  const boxesTokenIds = ErgoUtils.getBoxAssetsSum(newErgoBoxes).map(
    (token) => token.tokenId
  );
  boxesTokenIds.push(getConfig().rosen.eRSN);
  const tokensInfo = await watcherDatabase.getTokenEntity(boxesTokenIds);
  const tokensInfoMap = new Map<string, string>();
  tokensInfo.forEach((token) => {
    tokensInfoMap.set(token.tokenId, token.tokenName);
  });
  for (let i = 0; i < boxesTokenIds.length; i++) {
    const tokenId = boxesTokenIds[i];
    if (!tokensInfoMap.has(tokenId)) {
      const fetchedInfo = await ErgoNetwork.getTokenInfo(tokenId);
      const name = fetchedInfo.name || '';
      const decimals = fetchedInfo.decimals || 0;
      await watcherDatabase.insertTokenEntity(tokenId, name, decimals);
    }
  }
  return [...validCheckedBoxIds, ...newUTXOs.map((box) => box.boxId)];
};

/**
 * Runs the job of fetching token names of the new UTXOs
 * @param boxIds
 */
export const tokenNameJob = async (boxIds: string[]) => {
  if (!initialized) {
    try {
      const tokenMap = getConfig().token.tokenMap;
      const chains = tokenMap.getAllChains();
      const idKeyErgo = tokenMap.getIdKey(ERGO_CHAIN_NAME);
      for (const chain of chains) {
        const tokensData = tokenMap.getTokens(ERGO_CHAIN_NAME, chain);
        for (const tokenData of tokensData) {
          await watcherDatabase.insertTokenEntity(
            tokenData[idKeyErgo],
            tokenData.name,
            tokenData.decimals
          );
        }
      }
      initialized = true;
    } catch (e) {
      logger.warn(`token info initialization failed with error: ${e}`);
    }
  }
  let newBoxIds: string[] = [];
  try {
    newBoxIds = await tokenNameJobFunction(boxIds);
  } catch (e) {
    logger.warn(`TokenName Job failed with error: ${e.message} - ${e.stack}`);
  }

  setTimeout(
    tokenNameJob.bind(null, newBoxIds),
    getConfig().general.tokenNameInterval * 1000
  );
};
