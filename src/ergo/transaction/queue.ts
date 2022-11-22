import { TxEntity, TxType } from '../../database/entities/txEntity';
import { ErgoNetwork } from '../network/ergoNetwork';
import { WatcherDataBase } from '../../database/models/watcherModel';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { Config } from '../../config/config';
import { base64ToArrayBuffer } from '../../utils/utils';
import { WatcherUtils } from '../../utils/watcherUtils';
import { logger } from '../../log/Logger';

const config = Config.getConfig();

export class Queue {
  database: WatcherDataBase;
  databaseConnection: WatcherUtils;

  constructor(db: WatcherDataBase, dbConnection: WatcherUtils) {
    this.database = db;
    this.databaseConnection = dbConnection;
  }

  /**
   * process transaction if mined and confirmed enough.
   * remove from database and update observation status for it.
   * @param tx selected tx
   */
  private processConfirmedTx = async (tx: TxEntity) => {
    logger.info(
      `The [${tx.type}] transaction with txId: [${tx.txId}] is confirmed, removing the tx from txQueue`
    );
    await this.database.upgradeObservationTxStatus(tx.observation);
    await this.database.removeTx(tx);
  };

  /**
   * verify if transaction is valid already.
   * for commitment transactions must check observation be valid
   * and for trigger events must check trigger not merged
   * @param tx
   */
  private verifyTx = async (tx: TxEntity) => {
    if (tx.type === TxType.COMMITMENT) {
      return await this.databaseConnection.isObservationValid(tx.observation);
    } else if (tx.type === TxType.TRIGGER) {
      return !(await this.databaseConnection.isMergeHappened(tx.observation));
    }
    return false;
  };

  private removeTrial = async (tx: TxEntity, currentHeight: number) => {
    if (currentHeight - tx.updateBlock > config.transactionRemovingTimeout) {
      await this.database.downgradeObservationTxStatus(tx.observation);
      await this.database.removeTx(tx);
      logger.info(
        `Tx [${tx.txId}] is not valid anymore, removed from the tx queue.`
      );
    }
  };

  /**
   * process transaction if not mined
   * @param tx
   * @param currentHeight
   */
  private processUnConfirmedTx = async (
    tx: TxEntity,
    currentHeight: number
  ) => {
    const signedTx = wasm.Transaction.sigma_parse_bytes(
      base64ToArrayBuffer(tx.txSerialized)
    );
    if (await this.verifyTx(tx)) {
      const result = await ErgoNetwork.sendTx(signedTx.to_json());
      if (result.success) {
        await this.database.setTxUpdateHeight(tx, currentHeight);
        logger.info(
          `The [${tx.type}] transaction with txId: [${tx.txId}] sent succcessfully`
        );
      } else {
        if (!(await ErgoNetwork.checkTxInputs(signedTx.inputs()))) {
          logger.info(
            `Tx [${tx.txId}] inputs are not valid, skipping the transaction sending`
          );
          this.removeTrial(tx, currentHeight);
        } else {
          console.warn(`Error occurred while sending tx [${tx.id}]`);
        }
      }
    } else {
      logger.info(
        `Tx [${tx.txId} observation or commitments are not valid, skipping the transaction sending]`
      );
      this.removeTrial(tx, currentHeight);
    }
  };

  /**
   * Process single transaction object and update database if required
   * @param tx selected tx
   * @param currentHeight current blockchain height
   */
  private processTx = async (tx: TxEntity, currentHeight: number) => {
    const txStatus = await ErgoNetwork.getConfNum(tx.txId);
    logger.info(`Tx [${tx.txId}] confirmation: [${txStatus}]`);
    if (txStatus === -1) {
      await this.processUnConfirmedTx(tx, currentHeight);
    } else if (txStatus > config.transactionConfirmation) {
      await this.processConfirmedTx(tx);
    } else {
      await this.database.setTxUpdateHeight(tx, currentHeight);
    }
  };

  /**
   * Fetches all active transactions from the database and updates their status
   * If the transaction doesn't exist in the network resends the transaction
   */
  job = async () => {
    const txs: Array<TxEntity> = await this.database.getAllTxs();
    const currentHeight = await ErgoNetwork.getHeight();
    logger.info(`Starting Transaction check job`);
    for (const tx of txs) {
      try {
        await this.processTx(tx, currentHeight);
      } catch (e) {
        logger.warn(`An error occurred while processing tx [${tx.txId}]: ${e}`);
      }
    }
    logger.info('Transactions check job is done', { count: txs.length });
  };
}
