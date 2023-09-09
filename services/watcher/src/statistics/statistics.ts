import { WatcherDataBase } from '../database/models/watcherModel';
import { base64ToArrayBuffer } from '../utils/utils';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { getConfig } from '../config/config';

class Statistics {
  private static instance: Statistics;
  private static database: WatcherDataBase | undefined;
  private static watcherWID: string | undefined;
  private static isSetupCalled = false;

  /**
   * Setup function that class should setup before getting instance
   * @param db
   * @param wid
   */
  static setup = (db: WatcherDataBase, wid?: string) => {
    if (!Statistics.instance) {
      Statistics.database = db;
      Statistics.watcherWID = wid;
      Statistics.isSetupCalled = true;
    }
  };

  /**
   * Singleton Instance of the statistics class that get watcherDatabase and watcher WID if sets(tests)
   */
  static getInstance = () => {
    if (!Statistics.instance) {
      if (Statistics.isSetupCalled) Statistics.instance = new Statistics();
      else throw new Error("Setup doesn't called for Statistics");
    }
    return Statistics.instance;
  };

  /**
   * Getting watcher WID
   */
  getWID = () => {
    if (Statistics.watcherWID === undefined) {
      throw new Error("Watcher doesn't have any WID to see statistics");
    }
    return Statistics.watcherWID;
  };

  /**
   * Getting watcher received ergs and fees
   */
  getErgsAndFee = async () => {
    const WID = this.getWID();
    const permits = await Statistics.database!.getPermitBoxesByWID(WID);
    let ergs = 0n;
    const tokens: { [tokenId: string]: bigint } = {};
    permits.forEach((permit) => {
      const box = wasm.ErgoBox.sigma_parse_bytes(
        base64ToArrayBuffer(permit.boxSerialized)
      );
      ergs +=
        BigInt(box.value().as_i64().to_str()) -
        BigInt(getConfig().general.minBoxValue);
      for (let i = 0; i < box.tokens().len(); i++) {
        const token = box.tokens().get(i);
        const tokenId = token.id().to_str();
        const amount = BigInt(token.amount().as_i64().to_str());
        if (!Object.hasOwnProperty.call(tokens, tokenId)) {
          tokens[tokenId] = amount;
        } else {
          tokens[tokenId] += amount;
        }
      }
    });
    return { ergs: ergs, tokens: tokens };
  };

  /**
   * Getting watcher commitments count
   */
  getCommitmentsCount = async () => {
    const WID = this.getWID();
    return await Statistics.database!.commitmentsByWIDCount(WID);
  };

  /**
   * Getting watcher eventTriggers count
   */
  getEventTriggersCount = async () => {
    const WID = this.getWID();
    return await Statistics.database!.eventTriggersByWIDCount(WID);
  };

  /**
   * getting watcher commitments by page
   * @param offset
   * @param limit
   */
  getCommitments = async (offset = 0, limit = 10) => {
    const WID = this.getWID();
    const commitments = await Statistics.database!.commitmentByWID(
      WID,
      offset,
      limit
    );
    return commitments.map((commitment) => {
      return {
        eventId: commitment.eventId,
        boxId: commitment.boxId,
        block: commitment.block,
        height: commitment.height,
        spendBlock: commitment.spendBlock,
        spendHeight: commitment.spendHeight,
      };
    });
  };

  /**
   * getting watcher eventTriggers by page
   * @param offset
   * @param limit
   */
  getEventTriggers = async (offset = 0, limit = 10) => {
    const WID = this.getWID();
    const eventTriggers = await Statistics.database!.eventTriggersByWID(
      WID,
      offset,
      limit
    );
    return eventTriggers.map((event) => {
      return {
        boxId: event.boxId,
        block: event.block,
        height: event.height,
        fromChain: event.fromChain,
        toChain: event.toChain,
        fromAddress: event.fromAddress,
        toAddress: event.toAddress,
        amount: event.amount,
        bridgeFee: event.bridgeFee,
        networkFee: event.networkFee,
        sourceChainTokenId: event.sourceChainTokenId,
        targetChainTokenId: event.targetChainTokenId,
        sourceTxId: event.sourceTxId,
        sourceBlockId: event.sourceBlockId,
        spendBlock: event.spendBlock,
        spendHeight: event.spendHeight,
      };
    });
  };
}

export default Statistics;
