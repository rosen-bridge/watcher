import { TxEntity, TxType } from '../database/entities/txEntity';
import { ErgoNetwork } from './network/ergoNetwork';
import { WatcherDataBase } from '../database/models/watcherModel';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { Config } from '../config/config';
import { base64ToArrayBuffer } from '../utils/utils';
import { WatcherUtils } from '../utils/watcherUtils';

const config = Config.getConfig();

export class TransactionQueue {
  database: WatcherDataBase;
  databaseConnection: WatcherUtils;

  constructor(db: WatcherDataBase, dbConnection: WatcherUtils) {
    this.database = db;
    this.databaseConnection = dbConnection;
  }

  /**
   * Fetches all active transactions from the database and updates their status
   * If the transaction doesn't exist in the network resends the transaction
   */
  job = async () => {
    const txs: Array<TxEntity> = await this.database.getAllTxs();
    const currentHeight = await ErgoNetwork.getHeight();
    console.log(
      'Starting Transaction checking with',
      txs.length,
      'total number of transactions'
    );
    for (const tx of txs) {
      try {
        const txStatus = await ErgoNetwork.getConfNum(tx.txId);
        console.log('Tx', tx.txId, 'status is', txStatus);
        if (txStatus === -1) {
          const signedTx = wasm.Transaction.sigma_parse_bytes(
            base64ToArrayBuffer(tx.txSerialized)
          );
          if (
            // commitment validation
            (tx.type == TxType.COMMITMENT &&
              !(await this.databaseConnection.isObservationValid(
                tx.observation
              ))) ||
            // trigger validation
            (tx.type == TxType.TRIGGER &&
              (await this.databaseConnection.isMergeHappened(
                tx.observation
              ))) ||
            // transaction input validation
            !(await ErgoNetwork.checkTxInputs(signedTx.inputs()))
          ) {
            if (
              currentHeight - tx.updateBlock >
              config.transactionRemovingTimeout
            ) {
              await this.database.downgradeObservationTxStatus(tx.observation);
              await this.database.removeTx(tx);
            }
            console.log(currentHeight, tx.updateBlock);
            console.log('Skipping');
            continue;
          }
          // resend the tx
          console.log('Sending the', tx.type, 'transaction with txId', tx.txId);
          await ErgoNetwork.sendTx(signedTx.to_json());
          await this.database.setTxUpdateHeight(tx, currentHeight);
        } else if (txStatus > config.transactionConfirmation) {
          console.log(
            'The',
            tx.type,
            'transaction with txId',
            tx.txId,
            'is confirmed, removing the tx from txQueue'
          );
          await this.database.upgradeObservationTxStatus(tx.observation);
          await this.database.removeTx(tx);
        } else {
          await this.database.setTxUpdateHeight(tx, currentHeight);
        }
      } catch (e) {
        console.log(e);
        console.log(
          'Something went wrong, Skipping transaction checking with txId:',
          tx.txId
        );
      }
    }
  };
}
