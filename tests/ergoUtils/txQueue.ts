import { loadDataBase } from '../database/watcherDatabase';
import { TransactionQueue } from '../../src/ergo/transactionQueue';
import { TxEntity, TxType } from '../../src/database/entities/txEntity';
import { ErgoNetwork } from '../../src/ergo/network/ergoNetwork';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { Boxes } from '../../src/ergo/boxes';
import { secret1, userAddress } from '../ergo/transactions/permit';
import { Transaction } from '../../src/api/Transaction';
import { WatcherDataBase } from '../../src/database/models/watcherModel';

import { Buffer } from 'buffer';
import * as wasm from 'ergo-lib-wasm-nodejs';
import chai, { expect } from 'chai';
import spies from 'chai-spies';
chai.use(spies);

import txObj from '../ergo/dataset/tx.json' assert { type: 'json' };
import { WatcherUtils } from '../../src/utils/watcherUtils';
import { rosenConfig } from '../../src/config/rosenConfig';

const tx = wasm.Transaction.from_json(JSON.stringify(txObj));

const height = 1000;
export const observation: ObservationEntity = new ObservationEntity();
observation.requestId = 'requestId';
const txEntity = new TxEntity();
txEntity.observation = observation;
txEntity.txId = 'txId';
txEntity.txSerialized = Buffer.from(tx.sigma_serialize_bytes()).toString(
  'base64'
);
txEntity.updateBlock = height - 1;

describe('Transaction queue tests', () => {
  let dataBase: WatcherDataBase,
    boxes: Boxes,
    transaction: Transaction,
    dbConnection: WatcherUtils;
  let txQueue: TransactionQueue;
  before(async () => {
    dataBase = await loadDataBase('commitmentReveal', true);
    boxes = new Boxes(rosenConfig, dataBase);
    transaction = new Transaction(rosenConfig, userAddress, secret1, boxes);
    dbConnection = new WatcherUtils(dataBase, transaction, 0, 100);
    txQueue = new TransactionQueue(dataBase, dbConnection);
  });

  afterEach(() => {
    chai.spy.restore(ErgoNetwork);
  });

  /**
   * Target: testing TransactionQueue job
   * Dependencies:
   *    networkDatabase
   *    DatabaseConnection
   *    ErgoNetwork
   * Test Procedure:
   *    1- Mocking environment
   *    2- calling function
   *    3- validate used functions with inputs
   */
  describe('TransactionQueue job', () => {
    /**
     * Expected Output:
     *    The function should resend the ready commitment transaction
     *    Because its unavailable, but still valid
     */
    it('should resend the commitment transaction', async () => {
      txEntity.type = TxType.COMMITMENT;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'setTxUpdateHeight', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx');
      chai.spy.on(ErgoNetwork, 'checkTxInputs', () => true);
      chai.spy.on(dbConnection, 'isObservationValid', () => true);
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.been.called.with(tx.to_json());
      expect(dataBase.setTxUpdateHeight).have.been.called.once;
    });

    /**
     * Expected Output:
     *    The function should resend the ready trigger transaction
     *    Because its unavailable, but still valid
     */
    it('should resend the trigger transaction', async () => {
      txEntity.type = TxType.TRIGGER;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'setTxUpdateHeight', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx');
      chai.spy.on(ErgoNetwork, 'checkTxInputs', () => true);
      chai.spy.on(dbConnection, 'isMergeHappened', () => false);
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.been.called.with(tx.to_json());
      expect(dataBase.setTxUpdateHeight).have.been.called.once;
    });

    /**
     * Expected Output:
     *    The function should wait for transaction removing
     *    Because the observation is not still valid, but it may have change in a small period
     */
    it('should just wait for commitment transaction status', async () => {
      txEntity.type = TxType.COMMITMENT;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'setTxUpdateHeight', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx');
      chai.spy.on(dbConnection, 'isObservationValid', () => false);
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.not.been.called;
      expect(dataBase.setTxUpdateHeight).have.not.been.called;
    });

    /**
     * Expected Output:
     *    The function should wait for transaction removing
     *    Because the commitment has already merged, but it may have forked in a small period
     */
    it('should just wait for trigger transaction status', async () => {
      txEntity.type = TxType.TRIGGER;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'setTxUpdateHeight', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx');
      chai.spy.on(dbConnection, 'isMergeHappened', () => true);
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.not.been.called;
      expect(dataBase.setTxUpdateHeight).have.not.been.called;
    });

    /**
     * Expected Output:
     *    The function should wait for transaction removing
     *    Because the transaction inputs are spent, but it may have change in a small period
     */
    it('should just wait for trigger transaction status because its inputs are spent', async () => {
      txEntity.type = TxType.TRIGGER;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'setTxUpdateHeight', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx');
      chai.spy.on(ErgoNetwork, 'checkTxInputs', () => false);
      chai.spy.on(dbConnection, 'isMergeHappened', () => false);
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.not.been.called;
      expect(dataBase.setTxUpdateHeight).have.not.been.called;
    });

    /**
     * Expected Output:
     *    The function should update the transaction updateTime and wait for its status
     *    Because the transaction is in mempool or is not confirmed enough
     */
    it('should update the updateTime and wait more for tx status', async () => {
      txEntity.type = TxType.COMMITMENT;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'setTxUpdateHeight', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => 0);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx');
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.not.been.called;
      expect(dataBase.setTxUpdateHeight).have.been.called.once;
    });

    /**
     * Expected Output:
     *    The function should wait for transaction removing
     *    Because the observation is not still valid, but it may have change in a small period
     */
    it('should remove the tx from database because it get enough confirmation', async () => {
      txEntity.type = TxType.COMMITMENT;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'setTxUpdateHeight', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => 200);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx');
      chai.spy.on(dataBase, 'upgradeObservationTxStatus', () => undefined);
      chai.spy.on(dataBase, 'removeTx', () => undefined);
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.not.been.called;
      expect(dataBase.upgradeObservationTxStatus).have.been.called.with(
        observation
      );
      expect(dataBase.removeTx).have.been.called.with(txEntity);
    });

    /**
     * Expected Output:
     *    The function should remove the transaction
     *    Because the transaction inputs are spent, and the status is stabilized
     */
    it('should remove the commitment transaction because its inputs are spent and it has passed the timeout', async () => {
      txEntity.type = TxType.COMMITMENT;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'downgradeObservationTxStatus', () => undefined);
      chai.spy.on(dataBase, 'removeTx', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height + 1000);
      chai.spy.on(ErgoNetwork, 'sendTx');
      chai.spy.on(ErgoNetwork, 'checkTxInputs', () => false);
      chai.spy.on(dbConnection, 'isObservationValid', () => true);
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.not.been.called;
      expect(dataBase.downgradeObservationTxStatus).have.been.called.with(
        observation
      );
      expect(dataBase.removeTx).have.been.called.with(txEntity);
    });
  });
});
