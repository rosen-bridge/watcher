import { BridgeMinimumFee, Fee } from '@rosen-bridge/minimum-fee';
import { getConfig } from '../config/config';
import { ERGO_CHAIN_NAME } from '../config/constants';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';

class MinimumFee {
  static bridgeMinimumFee = new BridgeMinimumFee(
    getConfig().general.explorerUrl,
    getConfig().rosen.rsnRatioNFT
  );

  /**
   * gets minimum fee config for an observation
   * @param observation
   */
  static getEventFeeConfig = async (
    observation: ObservationEntity
  ): Promise<Fee> => {
    const tokenMap = getConfig().token.tokenMap;
    const tokenId = tokenMap.getID(
      tokenMap.search(observation.fromChain, {
        [tokenMap.getIdKey(observation.fromChain)]:
          observation.sourceChainTokenId,
      })[0],
      ERGO_CHAIN_NAME
    );
    return await MinimumFee.bridgeMinimumFee.getFee(
      tokenId,
      observation.fromChain,
      observation.height
    );
  };
}

export default MinimumFee;
