import { TxEntity, TxType } from '../../database/entities/txEntity';
import { ErgoNetwork } from '../network/ergoNetwork';
import { WatcherDataBase } from '../../database/models/watcherModel';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { base64ToArrayBuffer } from '../../utils/utils';
import { WatcherUtils } from '../../utils/watcherUtils';
import { getConfig } from '../../config/config';
import { Transaction } from '../../api/Transaction';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { TxStatus } from '../../database/entities/observationStatusEntity';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

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
  processConfirmedTx = async (tx: TxEntity) => {
    logger.info(
      `The [${tx.type}] transaction with txId: [${tx.txId}] is confirmed, removing the tx from txQueue`
    );
    if (tx.type === TxType.PERMIT) {
      logger.debug(
        `WID: [${Transaction.watcherWID}], Unconfirmed WID: [${Transaction.watcherUnconfirmedWID}]`
      );
      Transaction.watcherWID = Transaction.watcherUnconfirmedWID;
      Transaction.watcherPermitState = !!Transaction.watcherWID;
      logger.debug(`permit state: [${Transaction.watcherPermitState}]`);
    }
    if (tx.type === TxType.REDEEM) {
      // process transaction commitments
      const signedTx = wasm.Transaction.sigma_parse_bytes(
        base64ToArrayBuffer(tx.txSerialized)
      );
      const inputs = signedTx.inputs();
      const inputIds = Array(inputs.len())
        .fill('')
        .map((item, index) => inputs.get(index).box_id().to_str());
      const events = (await this.database.findCommitmentsById(inputIds)).map(
        (item) => item.eventId
      );
      await this.database.updateObservationStatusForEventIds(events);
    }
    if (tx.observation) {
      if (await this.database.getObservationsStatus([tx.observation.id])) {
        await this.database.upgradeObservationTxStatus(tx.observation);
      }
    }
    await this.database.removeTx(tx);
  };

  /**
   * verify if transaction is valid already.
   * for commitment transactions must check observation be valid
   * and for trigger events must check trigger not merged
   * TODO: add unit-test for this function in refactor
   * @param tx
   */
  private verifyTx = async (tx: TxEntity) => {
    switch (tx.type) {
      case TxType.COMMITMENT:
        return await this.databaseConnection.isObservationValid(
          tx.observation!
        );
      case TxType.TRIGGER:
        return !(await this.databaseConnection.isMergeHappened(
          tx.observation!
        ));
      case TxType.DETACH:
      case TxType.REDEEM:
      case TxType.PERMIT:
      case TxType.REWARD:
        return true;
      default:
        return false;
    }
  };

  private validateTxInputsAndOutputs = async (
    tx: wasm.Transaction
  ): Promise<boolean> => {
    if (!(await ErgoNetwork.checkTxInputs(tx.id().to_str(), tx.inputs()))) {
      logger.info(
        `Tx [${tx
          .id()
          .to_str()}] inputs are spent or not valid, skipped sending, it will be removed soon.`
      );
      return false;
    }
    if (!(await ErgoNetwork.checkOutputHeight(tx.inputs(), tx.outputs()))) {
      logger.info(
        `Tx [${tx
          .id()
          .to_str()}] output heights are not valid, skipped sending, it will be removed soon.`
      );
      return false;
    }
    return true;
  };

  /**
   * Removes invalid and timed out transaction from tx queue after enough confirmation,
   * and updates the related observation status
   * @param tx
   * @param currentHeight
   */
  private resetTxStatus = async (tx: TxEntity, currentHeight: number) => {
    logger.debug(
      `Updating ${tx.type} transaction with txId [${tx.txId}] status to invalid`
    );
    await this.database.setTxValidStatus(tx, false);
    if (
      currentHeight - tx.updateBlock >
      getConfig().general.transactionRemovingTimeout
    ) {
      if (tx.observation)
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
        logger.debug(
          `Updating ${tx.type} transaction with txId [${tx.txId}] status to valid`
        );
        await this.database.setTxValidStatus(tx, true);
        await this.database.setTxUpdateHeight(tx, currentHeight);
        logger.info(
          `The ${tx.type} transaction with txId [${tx.txId}] sent successfully`
        );
      } else {
        if (!(await this.validateTxInputsAndOutputs(signedTx))) {
          this.resetTxStatus(tx, currentHeight);
        } else {
          logger.warn(
            `Error occurred while sending ${tx.type} tx [${tx.txId}]`
          );
        }
      }
    } else {
      logger.info(
        `Tx [${tx.txId}] of type ${tx.type} observation or commitments are not valid, skipping the transaction sending]`
      );
      this.resetTxStatus(tx, currentHeight);
    }
  };

  /**
   * Process single transaction object and update database if required
   * @param tx selected tx
   * @param currentHeight current blockchain height
   */
  private processTx = async (tx: TxEntity, currentHeight: number) => {
    const txStatus = await ErgoNetwork.getConfNum(tx.txId);
    logger.info(
      `Processing ${tx.type} tx [${tx.txId}] with confirmation [${txStatus}]`
    );
    if (txStatus === -1) {
      await this.processUnConfirmedTx(tx, currentHeight);
    } else if (txStatus > getConfig().general.transactionConfirmation) {
      logger.debug(
        `Updating ${tx.type} transaction with txId [${tx.txId}] status to valid`
      );
      await this.database.setTxValidStatus(tx, true);
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
        if (e instanceof Error)
          logger.warn(
            `An error occurred while processing tx [${tx.txId}] with type ${tx.type}: ${e.message} - ${e.stack}`
          );
        else
          logger.warn(
            `An unknown problem occurred while processing tx [${tx.txId}] with type ${tx.type}: ${e}`
          );
      }
    }
    logger.info('Transactions check job is done', { count: txs.length });
  };
}
