import { watcherDatabase } from '../init';
import { decodeSerializedBox, ErgoUtils } from '../ergo/utils';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { loggerFactory } from '../log/Logger';
import { getConfig } from '../config/config';

const logger = loggerFactory(import.meta.url);

const jobFunction = async (checkedBoxIds: string[]): Promise<string[]> => {
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
      await watcherDatabase.insertTokenEntity(tokenId, name);
    }
  }
  return [...validCheckedBoxIds, ...newUTXOs.map((box) => box.boxId)];
};

export const tokenNameJob = async (boxIds: string[]) => {
  let newBoxIds: string[] = [];
  try {
    newBoxIds = await jobFunction(boxIds);
  } catch (e) {
    logger.warn(`TokenName Job failed with error: ${e.message} - ${e.stack}`);
  }

  setTimeout(
    tokenNameJob.bind(null, newBoxIds),
    getConfig().general.tokenNameInterval * 1000
  );
};
