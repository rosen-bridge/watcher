import { loadDataBase } from '../database/watcherDatabase';
import { Queue } from '../../src/ergo/transaction/queue';
import { TxEntity, TxType } from '../../src/database/entities/txEntity';
import { ErgoNetwork } from '../../src/ergo/network/ergoNetwork';
import { ObservationEntity } from '@rosen-bridge/abstract-observation-extractor';
import { Boxes } from '../../src/ergo/boxes';
import { secret1, userAddress } from '../ergo/transactions/permit';
import { WatcherDataBase } from '../../src/database/models/watcherModel';

import { Buffer } from 'buffer';
import * as wasm from 'ergo-lib-wasm-nodejs';
import chai, { expect } from 'chai';
import spies from 'chai-spies';
chai.use(spies);

import txObj from '../ergo/dataset/tx.json' assert { type: 'json' };
import { TransactionUtils, WatcherUtils } from '../../src/utils/watcherUtils';
import TransactionTest from '../../src/api/TransactionTest';
import { Transaction } from '../../src/api/Transaction';
import { createMemoryDatabase } from '../resources/inMemoryDb';
import { DataSource } from '@rosen-bridge/extended-typeorm';

const tx = wasm.Transaction.from_json(JSON.stringify(txObj));

const height = 1000;
export const observation: ObservationEntity = new ObservationEntity();
observation.requestId = 'requestId';
observation.height = 123;
observation.rawData = JSON.stringify({});
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
    transaction: TransactionTest,
    dbConnection: WatcherUtils;
  let txQueue: Queue;
  before(async () => {
    const ORM = await loadDataBase();
    dataBase = ORM.DB;
    boxes = new Boxes(dataBase);
    await TransactionTest.setup(userAddress, secret1, boxes, dataBase);
    transaction = TransactionTest.getInstance();
    dbConnection = new WatcherUtils(dataBase, 0, 100);
    txQueue = new Queue(dataBase, dbConnection);
  });

  afterEach(() => {
    chai.spy.restore();
  });

  /**
   * Target: testing Queue job
   * Dependencies:
   *    networkDatabase
   *    DatabaseConnection
   *    ErgoNetwork
   * Test Procedure:
   *    1- Mocking environment
   *    2- calling function
   *    3- validate used functions with inputs
   */
  describe('Queue job', () => {
    /**
     * Expected Output:
     *    The function should resend the ready commitment transaction
     *    Because its unavailable, but still valid
     */
    it('should resend the commitment transaction', async () => {
      txEntity.type = TxType.COMMITMENT;
      chai.spy.on(dataBase, 'getAllTxs', () => [txEntity]);
      chai.spy.on(dataBase, 'setTxUpdateHeight', () => undefined);
      chai.spy.on(dataBase, 'setTxValidStatus', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx', () => {
        return { success: true };
      });
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
      chai.spy.on(dataBase, 'setTxValidStatus', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx', () => {
        return { success: true };
      });
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
      chai.spy.on(dataBase, 'setTxValidStatus', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height);
      chai.spy.on(ErgoNetwork, 'sendTx');
      chai.spy.on(ErgoNetwork, 'checkTxInputs', () => false);
      chai.spy.on(dbConnection, 'isMergeHappened', () => false);
      await txQueue.job();
      expect(ErgoNetwork.sendTx).have.not.been.called;
      expect(dataBase.setTxUpdateHeight).have.not.been.called;
      expect(dataBase.setTxValidStatus).have.been.called;
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
      chai.spy.on(dataBase, 'setTxValidStatus', () => undefined);
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
      chai.spy.on(dataBase, 'setTxValidStatus', () => undefined);
      chai.spy.on(ErgoNetwork, 'getConfNum', () => -1);
      chai.spy.on(ErgoNetwork, 'getHeight', () => height + 1000);
      chai.spy.on(ErgoNetwork, 'sendTx', () => {
        return { success: false };
      });
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

  describe('processConfirmedTx', () => {
    let db: DataSource, watcherDb: WatcherDataBase, txQueue: Queue;

    before(async () => {
      db = await createMemoryDatabase();
      watcherDb = new WatcherDataBase(db);
      dbConnection = new WatcherUtils(watcherDb, 0, 100);
      txQueue = new Queue(watcherDb, dbConnection);
    });

    /**
     * @target Queue.processConfirmedTx should set watcherWID
     * and toggle watcherPermitState when confirmed tx type is PERMIT
     * @dependencies
     * @scenario
     * - mock Transaction variables (permitState and WIDs)
     * - mock a TxEntity and insert into db
     * - run test
     * - check if variables changed
     * @expected
     * - watcherWID should equal to mocked value
     * - watcherPermitState should be true
     * - txEntity 'deleted' field should be true
     */
    it('should set watcherWID and toggle watcherPermitState when confirmed tx type is PERMIT', async () => {
      // mock Transaction variables (permitState and WIDs)
      Transaction.watcherPermitState = false;
      Transaction.watcherWID = undefined;
      Transaction.watcherUnconfirmedWID = 'mockedWID';

      // mock TxEntity
      await watcherDb.submitTx(
        'serializedTx2',
        'mockedTxId2',
        TxType.PERMIT,
        100
      );
      const tx = (await watcherDb.getActivePermitTransactions())[0];

      // run test
      await txQueue.processConfirmedTx(tx);

      // check if variables changed
      expect(Transaction.watcherPermitState).to.be.equal(true);
      expect(Transaction.watcherWID).to.be.equal('mockedWID');
      const dbTxs = await db.getRepository(TxEntity).find();
      expect(dbTxs.length).to.be.equal(1);
      expect(dbTxs[0].deleted).to.be.equal(true);
    });
  });
});
