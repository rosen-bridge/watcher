import { Config } from '../config/config';
import { ErgoNetwork } from '../ergo/network/ergoNetwork';
import { WatcherDataBase } from '../database/models/watcherModel';
import { watcherTransaction } from '../index';
import { base64ToArrayBuffer } from '../utils/utils';
import * as wasm from 'ergo-lib-wasm-nodejs';

const config = Config.getConfig();

class Statistics {
  private static instance: Statistics;
  private readonly database: WatcherDataBase;
  watcherWID: string | undefined;

  private constructor(watcherDB: WatcherDataBase, wid?: string) {
    this.database = watcherDB;
    if (!wid) this.watcherWID = watcherTransaction.watcherWID;
    else this.watcherWID = wid;
  }

  static getInstance = (watcherDB: WatcherDataBase, wid?: string) => {
    if (!Statistics.instance) {
      Statistics.instance = new Statistics(watcherDB, wid);
    }
    return Statistics.instance;
  };

  /**
   * Getting watcher WID
   */
  getWID = () => {
    if (this.watcherWID === undefined) {
      throw new Error("Watcher doesn't have any WID to see statistics");
    }
    return this.watcherWID;
  };

  /**
   * Getting watcher received ergs and fees
   */
  getErgsAndFee = async () => {
    const WID = this.getWID();
    const permits = await this.database.getPermitBoxesByWID(WID);
    let ergs = 0n;
    const tokens: { [tokenId: string]: bigint } = {};
    permits.forEach((permit) => {
      const box = wasm.ErgoBox.sigma_parse_bytes(
        base64ToArrayBuffer(permit.boxSerialized)
      );
      ergs +=
        BigInt(box.value().as_i64().to_str()) - BigInt(config.minBoxValue);
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
    return await this.database.commitmentsByWIDCount(WID);
  };

  /**
   * Getting watcher eventTriggers count
   */
  getEventTriggersCount = async () => {
    const WID = this.getWID();
    return await this.database.eventTriggersByWIDCount(WID);
  };

  /**
   * getting watcher commitments by page
   * @param offset
   * @param limit
   */
  getCommitments = async (offset = 0, limit = 10) => {
    const WID = this.getWID();
    const commitments = await this.database.commitmentByWID(WID, offset, limit);
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
    const eventTriggers = await this.database.eventTriggersByWID(
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
