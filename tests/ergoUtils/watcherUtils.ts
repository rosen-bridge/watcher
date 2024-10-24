import { loadDataBase } from '../database/watcherDatabase';
import { TxStatus } from '../../src/database/entities/observationStatusEntity';
import {
  commitmentEntity,
  eventTriggerEntity,
  newEventTriggerEntity,
  observationEntity1,
  observationEntity3,
  observationStatusCommitted,
  observationStatusNotCommitted,
  observationStatusRevealed,
  observationStatusTimedOut,
  redeemedCommitment,
  unspentCommitment,
  unspentCommitment2,
  unspentCommitmentDuplicate,
} from '../database/mockedData';
import { Boxes } from '../../src/ergo/boxes';
import { secret1, userAddress } from '../ergo/transactions/permit';
import { JsonBI } from '../../src/ergo/network/parser';
import txObj from '../ergo/transactions/dataset/commitmentTx.json' assert { type: 'json' };
import { WatcherDataBase } from '../../src/database/models/watcherModel';
import { TxType } from '../../src/database/entities/txEntity';

import * as wasm from 'ergo-lib-wasm-nodejs';
import chai, { expect } from 'chai';
import spies from 'chai-spies';
import { NoObservationStatus } from '../../src/errors/errors';
import { ErgoNetwork } from '../../src/ergo/network/ergoNetwork';
import { TransactionUtils, WatcherUtils } from '../../src/utils/watcherUtils';
import TransactionTest from '../../src/api/TransactionTest';
import MinimumFeeHandler from '../../src/utils/MinimumFeeHandler';
import { ChainMinimumFee } from '@rosen-bridge/minimum-fee';

chai.use(spies);

const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj));

describe('Testing the WatcherUtils & TransactionUtils', () => {
  let dataBase: WatcherDataBase,
    boxes: Boxes,
    transaction: TransactionTest,
    watcherUtils: WatcherUtils,
    txUtils: TransactionUtils;
  beforeEach(async () => {
    const ORM = await loadDataBase();
    dataBase = ORM.DB;
    boxes = new Boxes(dataBase);
    await TransactionTest.setup(userAddress, secret1, boxes, dataBase);
    txUtils = new TransactionUtils(dataBase);
    transaction = TransactionTest.getInstance();
    watcherUtils = new WatcherUtils(dataBase, 0, 100);
  });

  describe('allReadyObservations', () => {
    /**
     * Target: testing allReadyObservations
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all ready observations for commitment creation
     *    It should return one observation since
     *      - it has enough confirmation
     *      - it is still valid. didn't pass the threshold
     *      - the status is NOT-COMMITTED
     *      - trigger is not created yet
     *      - watcher didn't create commitment for this observation
     */
    it('should return an observation', async () => {
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusNotCommitted
      );
      chai.spy.on(watcherUtils, 'isMergeHappened', () => false);
      chai.spy.on(watcherUtils, 'hasValidAmount', () => true);
      const data = await watcherUtils.allReadyObservations();
      expect(data).to.have.length(1);
    });

    /**
     * Target: testing allReadyObservations
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all ready observations for commitment creation
     *    It should return nothing since the stored observation trigger had been created
     */
    it('should return zero observations', async () => {
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusNotCommitted
      );
      chai.spy.on(watcherUtils, 'isMergeHappened', () => true);
      const data = await watcherUtils.allReadyObservations();
      expect(data).to.have.length(0);
    });

    /**
     * Target: testing allReadyObservations
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all ready observations for commitment creation
     *    It should return nothing since the stored observation had passed the valid threshold
     */
    it('should return no observations', async () => {
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      chai.spy.on(dataBase, 'updateObservationTxStatus', () => undefined);
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 215);
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusNotCommitted
      );
      const data = await watcherUtils.allReadyObservations();
      expect(data).to.have.length(0);
      expect(dataBase.updateObservationTxStatus).to.have.been.called.with(
        observationEntity1,
        TxStatus.TIMED_OUT
      );
    });
  });

  describe('allTimeoutCommitments', () => {
    /**
     * @target WatcherUtils.allTimeoutCommitments should return one commitment
     * @dependencies
     * - watcherDatabase
     * @scenario
     * - mock environment
     * - run test
     * - check returned value
     * @expected
     * - it should return one commitment
     */
    it('should return one commitment', async () => {
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 150);
      chai.spy.on(dataBase, 'commitmentsByWIDAndMaxHeight', () => [
        commitmentEntity,
      ]);
      const data = await watcherUtils.allTimeoutCommitments(10);
      expect(data).to.have.length(1);
      expect(dataBase.commitmentsByWIDAndMaxHeight).to.have.been.called.with(
        TransactionTest.watcherWID,
        140
      );
    });
  });

  describe('allReadyCommitmentSets', () => {
    /**
     * Target: testing allReadyCommitmentSets
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all ready commitments along with the related observation for trigger creation
     *    It should return one commitment set with two commitments, since:
     *      - observation status is COMMITTED
     *      - commitments are unspent (One is redeemed not merged)
     */
    it('should return one commitment set with two unspent commitments', async () => {
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusCommitted
      );
      chai.spy.on(dataBase, 'commitmentsByEventId', () => [
        unspentCommitment,
        unspentCommitment2,
      ]);
      chai.spy.on(dataBase, 'eventTriggerBySourceTxId', () => null);
      chai.spy.on(watcherUtils, 'hasValidAmount', () => true);
      const data = await watcherUtils.allReadyCommitmentSets();
      expect(data).to.have.length(1);
      expect(data[0].commitments).to.have.length(2);
    });

    /**
     * Target: testing allReadyCommitmentSets
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all ready commitments along with the related observation for trigger creation
     *    It should return nothing since the observation has no status or database had a problem
     */
    it('should not return commitment set, status not set', async () => {
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      const data = await watcherUtils.allReadyCommitmentSets();
      expect(data).to.have.length(0);
    });

    /**
     * Target: testing allReadyCommitmentSets
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all ready commitments along with the related observation for trigger creation
     *    It should return nothing since the observation status is NOT-COMMITTED
     */
    it('should not return commitment set, status is not-committed', async () => {
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusNotCommitted
      );
      const data = await watcherUtils.allReadyCommitmentSets();
      expect(data).to.have.length(0);
    });

    /**
     * Target: testing allReadyCommitmentSets
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    It should return nothing since the observation amount is not valid
     */
    it('should not return commitment set, observation is invalid', async () => {
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusCommitted
      );
      chai.spy.on(dataBase, 'commitmentsByEventId', () => [
        unspentCommitment,
        unspentCommitment2,
        redeemedCommitment,
      ]);
      chai.spy.on(dataBase, 'eventTriggerBySourceTxId', () => null);
      chai.spy.on(watcherUtils, 'hasValidAmount', () => false);

      const data = await watcherUtils.allReadyCommitmentSets();
      expect(data).to.have.length(0);
    });

    /**
     * Target: testing allReadyCommitmentSets
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all ready commitments along with the related observation for trigger creation
     *    It should return nothing since one of the commitments is merged to create the trigger
     */
    it('should not return any commitment set, one of them is merged', async () => {
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusCommitted
      );
      chai.spy.on(dataBase, 'commitmentsByEventId', () => [
        unspentCommitment,
        redeemedCommitment,
      ]);
      chai.spy.on(
        dataBase,
        'eventTriggerBySourceTxId',
        () => eventTriggerEntity
      );
      chai.spy.on(dataBase, 'updateObservationTxStatus', () => undefined);
      chai.spy.on(watcherUtils, 'hasValidAmount', () => true);

      const data = await watcherUtils.allReadyCommitmentSets();
      expect(dataBase.updateObservationTxStatus).to.have.been.called.with(
        observationEntity1,
        TxStatus.REVEALED
      );
      expect(data).to.have.length(0);
    });

    /**
     * Target:
     * It should not return duplicate commitments
     *
     * Dependencies:
     * - watcherDatabase
     *
     * Scenario:
     * N/A
     *
     * Expected Output:
     * The function should return a set with only one commitment
     */
    it('should not return duplicate commitments', async () => {
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'getConfirmedObservations', () => [
        observationEntity1,
      ]);
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusCommitted
      );
      chai.spy.on(dataBase, 'commitmentsByEventId', () => [
        unspentCommitment,
        unspentCommitmentDuplicate,
      ]);
      chai.spy.on(dataBase, 'eventTriggerBySourceTxId', () => null);
      chai.spy.on(watcherUtils, 'hasValidAmount', () => true);

      const data = await watcherUtils.allReadyCommitmentSets();
      const actual = data[0].commitments.length;

      const expected = 1;
      expect(actual).to.equal(expected);
    });
  });

  describe('isObservationValid', () => {
    /**
     * Target: testing isObservationValid
     * Dependencies:
     *    watcherDatabase
     * Expected Output:
     *    The function should return false since the observation amount is not valid
     */
    it('should return false since the observation amount is not valid', async () => {
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusNotCommitted
      );
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'commitmentsByEventId', () => [commitmentEntity]);
      chai.spy.on(watcherUtils, 'hasValidAmount', () => false);

      const data = await watcherUtils.isObservationValid(observationEntity1);
      expect(data).to.be.false;
    });

    /**
     * Target: testing isObservationValid
     * Dependencies:
     *    watcherDatabase
     * Expected Output:
     *    The function should return false since the observation passed the valid threshold
     */
    it('should return false since the status is timeout', async () => {
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusTimedOut
      );
      const data = await watcherUtils.isObservationValid(observationEntity1);
      expect(data).to.be.false;
    });

    /**
     * Target: testing isObservationValid
     * Dependencies:
     *    watcherDatabase
     * Expected Output:
     *    The function should return false since this watcher have created this commitment beforehand
     */
    it('should return false since this watcher have created this commitment beforehand', async () => {
      commitmentEntity.WID = TransactionTest.watcherWID
        ? TransactionTest.watcherWID
        : '';
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusNotCommitted
      );
      chai.spy.on(dataBase, 'getLastBlockHeight', () => 15);
      chai.spy.on(dataBase, 'commitmentsByEventId', () => [commitmentEntity]);
      chai.spy.on(watcherUtils, 'hasValidAmount', () => true);

      const data = await watcherUtils.isObservationValid(observationEntity1);
      expect(data).to.be.false;
    });

    /**
     * Target: testing isObservationValid
     * Dependencies:
     *    watcherDatabase
     * Expected Output:
     *    The function should throw error since the status have not been set correctly in the database
     */
    it('should return error due to status problem', async () => {
      chai.spy.on(dataBase, 'getStatusForObservations', () => null);
      await expect(
        watcherUtils.isObservationValid(observationEntity1)
      ).to.rejectedWith(NoObservationStatus);
    });
  });

  describe('isMergedHappened', () => {
    /**
     * Target: testing isMergedHappened
     * Dependencies:
     *    watcherDatabase
     * Expected Output:
     *   The function should return false since the trigger have been created lately
     */
    it('should return false since the status is revealed', async () => {
      chai.spy.on(
        dataBase,
        'getStatusForObservations',
        () => observationStatusRevealed
      );
      const data = await watcherUtils.isMergeHappened(observationEntity1);
      expect(data).to.be.true;
    });
  });

  describe('hasValidAmount', () => {
    afterEach(() => {
      chai.spy.restore();
    });

    /**
     * Target: testing hasValidAmount
     * Dependencies:
     * Expected Output:
     *   The function should return false since the bridgeFee + networkFee is greater than amount of observation
     */
    it('should return false since the bridgeFee + networkFee is greater than amount of observation', async () => {
      const fee: ChainMinimumFee = {
        bridgeFee: 100000n,
        networkFee: 100000n,
        rsnRatio: 0n,
        feeRatio: 0n,
        rsnRatioDivisor: 1000000000000n,
        feeRatioDivisor: 10000n,
      };
      const minimumFeeInstance = {};
      chai.spy.on(MinimumFeeHandler, 'getInstance', () => minimumFeeInstance);
      chai.spy.on(minimumFeeInstance, 'getEventFeeConfig', () => fee);

      const data = await watcherUtils.hasValidAmount(observationEntity1);
      expect(data).to.be.false;
    });

    /**
     * Target: testing hasValidAmount
     * Dependencies:
     * Expected Output:
     *   The function should return false since the bridgeFee + networkFee is more than amount of observation
     */
    it('should return false since the bridgeFee + networkFee is less than amount of observation', async () => {
      const fee: ChainMinimumFee = {
        bridgeFee: 2n,
        networkFee: 2n,
        rsnRatio: 0n,
        feeRatio: 0n,
        rsnRatioDivisor: 1000000000000n,
        feeRatioDivisor: 10000n,
      };
      const minimumFeeInstance = {};
      chai.spy.on(MinimumFeeHandler, 'getInstance', () => minimumFeeInstance);
      chai.spy.on(minimumFeeInstance, 'getEventFeeConfig', () => fee);

      const data = await watcherUtils.hasValidAmount(observationEntity1);
      expect(data).to.be.false;
    });

    /**
     * Target: testing hasValidAmount
     * Dependencies:
     * Expected Output:
     *   The function should return true since the bridgeFee + networkFee is less than amount of observation
     */
    it('should return true since the bridgeFee + networkFee is less than amount of observation', async () => {
      const fee: ChainMinimumFee = {
        bridgeFee: 2n,
        networkFee: 2n,
        rsnRatio: 0n,
        feeRatio: 0n,
        rsnRatioDivisor: 1000000000000n,
        feeRatioDivisor: 10000n,
      };
      const minimumFeeInstance = {};
      chai.spy.on(MinimumFeeHandler, 'getInstance', () => minimumFeeInstance);
      chai.spy.on(minimumFeeInstance, 'getEventFeeConfig', () => fee);

      const data = await watcherUtils.hasValidAmount(observationEntity3);
      expect(data).to.be.true;
    });
  });

  describe('submitTransaction', () => {
    /**
     * Target: testing submitTransaction
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate used functions with inputs
     * Expected Output:
     *    The function should submit a transaction and update its status
     */
    it('should submit a transaction and upgrade its status', async () => {
      chai.spy.on(ErgoNetwork, 'getHeight', () => 100);
      chai.spy.on(dataBase, 'upgradeObservationTxStatus', () => undefined);
      chai.spy.on(dataBase, 'submitTx', () => undefined);
      await txUtils.submitTransaction(
        signedTx,
        TxType.COMMITMENT,
        observationEntity1
      );
      expect(dataBase.submitTx).to.have.been.called.with(
        Buffer.from(signedTx.sigma_serialize_bytes()).toString('base64'),
        observationEntity1.requestId,
        signedTx.id().to_str(),
        TxType.COMMITMENT
      );
      expect(dataBase.upgradeObservationTxStatus).to.have.been.called.with(
        observationEntity1
      );
      expect(ErgoNetwork.getHeight).to.have.been.called.once;
      chai.spy.restore(ErgoNetwork);
    });
  });

  describe('isCommitmentValid', () => {
    /**
     * @target isCommitmentValid should return false if related trigger is spent
     * @dependencies
     * - DataBase
     * @scenario
     * - mock eventTriggerByEventId to return a spent trigger object
     * @expected
     * - to return false when spendBlock is set for the trigger
     */
    it('should return false if related trigger is spent', async () => {
      chai.spy.on(dataBase, 'eventTriggerByEventId', () => ({
        spendBlock: 'spendBlock',
      }));
      const result = await watcherUtils.isCommitmentValid(commitmentEntity);
      expect(result).to.be.false;
    });
  });
});
