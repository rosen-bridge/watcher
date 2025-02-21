import {
  ChainMinimumFee,
  ErgoNetworkType,
  MinimumFeeBox,
} from '@rosen-bridge/minimum-fee';
import { RosenTokens } from '@rosen-bridge/tokens';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { getConfig } from '../config/config';
import { ERGO_CHAIN_NAME, NODE_TYPE } from '../config/constants';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { TokensConfig } from '../config/tokensConfig';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

class MinimumFeeHandler {
  private static instance: MinimumFeeHandler;
  protected minimumFees = new Map<string, MinimumFeeBox>();

  private constructor() {
    // do nothing
  }

  /**
   * initializes minimum fee handler
   */
  static init = async (tokens: RosenTokens) => {
    const configs = getConfig();

    MinimumFeeHandler.instance = new MinimumFeeHandler();
    logger.debug('MinimumFeeHandler instantiated');


    const promises = tokens.map((chainToken) => {
      const token = chainToken[ERGO_CHAIN_NAME];
      const tokenId = token.tokenId;

      const { networkType, url } =
        configs.general.scannerType === NODE_TYPE
          ? {
              networkType: ErgoNetworkType.node,
              url: configs.general.nodeUrl,
            }
          : {
              networkType: ErgoNetworkType.explorer,
              url: configs.general.explorerUrl,
            };
      const tokenMinimumFeeBox = new MinimumFeeBox(
        tokenId,
        configs.rosen.rsnRatioNFT,
        networkType,
        url,
        logger
      );
      MinimumFeeHandler.instance.minimumFees.set(tokenId, tokenMinimumFeeBox);
      return tokenMinimumFeeBox.fetchBox();
    });

    await Promise.all(promises);
    logger.info('MinimumFeeHandler initialized');
  };

  /**
   * generates a MinimumFeeHandler object if it doesn't exist
   * @returns MinimumFeeHandler instance
   */
  static getInstance = () => {
    if (!MinimumFeeHandler.instance)
      throw Error(`MinimumFeeHandler instance doesn't exist`);
    return MinimumFeeHandler.instance;
  };

  /**
   * gets minimum fee config for an observation on it's target chain
   * @param observation the observation
   */
  getEventFeeConfig = (observation: ObservationEntity): ChainMinimumFee => {
    const instance = MinimumFeeHandler.getInstance();

    const tokenMap = TokensConfig.getInstance().getTokenMap();
    const token = tokenMap.search(observation.fromChain, {
      tokenId: observation.sourceChainTokenId,
    });
    if (token.length === 0)
      throw Error(
        `Failed to fetch minimum fee config for observation [${observation.requestId}]: source chain token [${observation.sourceChainTokenId}] is not found in token map for chain [${observation.fromChain}]`
      );
    const tokenId = tokenMap.getID(token[0], ERGO_CHAIN_NAME);

    const feeBox = instance.getMinimumFeeBoxObject(tokenId);

    return feeBox.getFee(
      observation.fromChain,
      observation.height,
      observation.toChain
    );
  };

  /**
   * gets MinimumFeeBox object
   * @param tokenId token id on Ergo chain
   */
  getMinimumFeeBoxObject = (tokenId: string): MinimumFeeBox => {
    const res = this.minimumFees.get(tokenId);
    if (!res)
      throw Error(
        `No minimum fee config is registered for token [${tokenId}]. Make sure id is for Ergo side and the token is in token map`
      );
    return res;
  };

  /**
   * updates minimum fee boxes
   */
  update = async (): Promise<void> => {
    for (const minimumFee of this.minimumFees.values()) {
      await minimumFee.fetchBox();
    }
  };
}

export default MinimumFeeHandler;
