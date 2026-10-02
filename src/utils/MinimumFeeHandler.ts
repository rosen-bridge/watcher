import * as wasm from 'ergo-lib-wasm-nodejs';
import {
  ChainMinimumFee,
  MinimumFeeBox,
  MinimumFeeExplorerNetwork,
  MinimumFeeNodeNetwork,
} from '@rosen-bridge/minimum-fee';
import { TokenMap } from '@rosen-bridge/tokens';
import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { getConfig } from '../config/config';
import {
  BITCOIN_CASH_CHAIN_NAME,
  ERGO_CHAIN_NAME,
  NODE_TYPE,
} from '../config/constants';
import { ObservationEntity } from '@rosen-bridge/abstract-observation-extractor';
import { TokensConfig } from '../config/tokensConfig';

const logger = DefaultLogger.getInstance().child(import.meta.url);

class MinimumFeeHandler {
  private static instance: MinimumFeeHandler | undefined;
  private static initialization: symbol;
  protected minimumFees = new Map<string, MinimumFeeBox>();

  private constructor() {
    // do nothing
  }

  /**
   * Initializes minimum fee boxes. BCH initialization publishes the handler
   * only after every box is fetched within the configured Ergo read deadline.
   * The network library does not expose cancellation; late reads stay private.
   * @param tokenMap tokens whose Ergo minimum fee boxes must be fetched
   */
  static init = async (tokenMap: TokenMap) => {
    const configs = getConfig();
    const nativeBitcoinCash =
      configs.general.networkWatcher === BITCOIN_CASH_CHAIN_NAME;
    const initialization = Symbol('minimum-fee-initialization');
    MinimumFeeHandler.initialization = initialization;
    const candidate = new MinimumFeeHandler();
    MinimumFeeHandler.instance = nativeBitcoinCash ? undefined : candidate;
    const timeoutMilliseconds =
      (configs.general.scannerType === NODE_TYPE
        ? configs.general.nodeTimeout
        : configs.general.explorerTimeout) * 1000;
    if (
      nativeBitcoinCash &&
      (!Number.isSafeInteger(timeoutMilliseconds) ||
        timeoutMilliseconds <= 0 ||
        timeoutMilliseconds > 0x7fffffff)
    )
      throw Error('Invalid Bitcoin Cash minimum-fee initialization timeout');
    const deadline = Date.now() + timeoutMilliseconds;
    /** Rejects an expired or superseded BCH initialization before publishing. */
    const assertCurrent = () => {
      if (MinimumFeeHandler.initialization !== initialization)
        throw Error('Bitcoin Cash minimum-fee initialization superseded');
      if (Date.now() >= deadline)
        throw Error(
          'Bitcoin Cash minimum-fee initialization deadline exceeded'
        );
    };
    logger.debug('MinimumFeeHandler instantiated');

    const network =
      configs.general.scannerType === NODE_TYPE
        ? new MinimumFeeNodeNetwork(
            configs.general.nodeUrl,
            logger.child(`NodeNetwork`)
          )
        : new MinimumFeeExplorerNetwork(
            configs.general.explorerUrl,
            logger.child(`ExplorerNetwork`)
          );
    /** Decodes an Ergo register using the configured minimum-fee box parser. */
    const decodeRegister = (register: string) => {
      return wasm.Constant.decode_from_base16(register).to_js();
    };

    // TODO: A function to apply token map updates is required for here
    // local:ergo/rosen-bridge/watcher#269
    /** Fetches all boxes with rejection handlers attached in the same turn. */
    const fetchBoxes = async () => {
      const promises = tokenMap.getConfig().map(async (chainToken) => {
        if (nativeBitcoinCash) assertCurrent();
        const token = chainToken[ERGO_CHAIN_NAME];
        const tokenId = token.tokenId;

        const tokenMinimumFeeBox = new MinimumFeeBox(
          tokenId,
          configs.rosen.minFeeNFT,
          network,
          decodeRegister,
          logger
        );
        candidate.minimumFees.set(tokenId, tokenMinimumFeeBox);
        if (nativeBitcoinCash) assertCurrent();
        return tokenMinimumFeeBox.fetchBox();
      });
      return await Promise.all(promises);
    };

    if (nativeBitcoinCash) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        assertCurrent();
        const expired = new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                Error(
                  'Bitcoin Cash minimum-fee initialization deadline exceeded'
                )
              ),
            deadline - Date.now()
          );
        });
        const fetched = await Promise.race([fetchBoxes(), expired]);
        assertCurrent();
        if (fetched.length === 0 || fetched.some((success) => success !== true))
          throw Error('Bitcoin Cash minimum-fee boxes could not be fetched');
        for (const box of candidate.minimumFees.values()) {
          assertCurrent();
          if (box.getConfigs().length === 0)
            throw Error(
              'Bitcoin Cash minimum-fee box has no fee configuration'
            );
        }
        assertCurrent();
        MinimumFeeHandler.instance = candidate;
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    } else {
      await fetchBoxes();
    }
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
