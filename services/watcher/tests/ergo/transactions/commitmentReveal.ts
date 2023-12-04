import { Boxes } from '../../../src/ergo/boxes';
import { WatcherDataBase } from '../../../src/database/models/watcherModel';
import { fillORM, loadDataBase } from '../../database/watcherDatabase';
import { JsonBI } from '../../../src/ergo/network/parser';
import { ErgoUtils } from '../../../src/ergo/utils';
import { ErgoNetwork } from '../../../src/ergo/network/ergoNetwork';
import { CommitmentReveal } from '../../../src/transactions/commitmentReveal';
import { Buffer } from 'buffer';
import { CommitmentSet } from '../../../src/utils/interfaces';
import { observation } from './commitmentCreation';
import { TxType } from '../../../src/database/entities/txEntity';
import { secret1, userAddress } from './permit';
import { firstCommitment, thirdCommitment } from '../../database/mockedData';

import * as wasm from 'ergo-lib-wasm-nodejs';
import { expect } from 'chai';
import chai from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';

import repoBox1Obj from './dataset/repoBox1.json' assert { type: 'json' };

chai.use(spies);

import commitmentObj from './dataset/commitmentBox.json' assert { type: 'json' };
import WIDObj from './dataset/WIDBox.json' assert { type: 'json' };
import plainObj from './dataset/plainBox.json' assert { type: 'json' };
import txObj from './dataset/commitmentTx.json' assert { type: 'json' };
import {
  TransactionUtils,
  WatcherUtils,
} from '../../../src/utils/watcherUtils';
import TransactionTest from '../../../src/api/TransactionTest';

const commitments = [wasm.ErgoBox.from_json(JsonBI.stringify(commitmentObj))];
const WIDBox = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj));
const plainBox = [wasm.ErgoBox.from_json(JsonBI.stringify(plainObj))];
const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj));
const repoBox1 = wasm.ErgoBox.from_json(JSON.stringify(repoBox1Obj));

const WIDs = [
  Buffer.from(firstCommitment.WID, 'hex'),
  Buffer.from(thirdCommitment.WID, 'hex'),
];

describe('Commitment reveal transaction tests', () => {
  let dataBase: WatcherDataBase,
    boxes: Boxes,
    transaction: TransactionTest,
    watcherUtils: WatcherUtils,
    txUtils: TransactionUtils;
  let cr: CommitmentReveal;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    dataBase = ORM.DB;
    boxes = new Boxes(dataBase);
    chai.spy.on(boxes, 'getRepoBox', () => WIDBox);
    TransactionTest.reset();
    await TransactionTest.setup(userAddress, secret1, boxes, dataBase);
    txUtils = new TransactionUtils(dataBase);
    transaction = TransactionTest.getInstance();
    watcherUtils = new WatcherUtils(dataBase, 0, 100);
    cr = new CommitmentReveal(watcherUtils, txUtils, boxes);
  });

  describe('triggerEventCreationTx', () => {
    /**
     * Target: testing triggerEventCreationTx
     * Dependencies:
     *    watcherUtils
     *    Boxes
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate used functions with inputs
     * Expected Output:
     *    The function should construct a valid trigger event creation tx
     *    It should also sign and send it successfully
     */
    it('Should create, sign and send a trigger event transaction', async () => {
      chai.spy.on(txUtils, 'submitTransaction', () => null);
      chai.spy.on(boxes, 'createTriggerEvent');
      sinon.stub(ErgoNetwork, 'getMaxHeight').resolves(111);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedTx);
      await cr.triggerEventCreationTx(
        commitments,
        repoBox1,
        observation,
        WIDs,
        plainBox
      );
      expect(boxes.createTriggerEvent).to.have.called.with(
        BigInt('1100000'),
        111,
        WIDs,
        observation
      );
      expect(txUtils.submitTransaction).to.have.been.called.with(
        signedTx,
        observation,
        TxType.TRIGGER
      );
      sinon.restore();
    });
  });

  describe('commitmentCheck', () => {
    /**
     * Target: testing commitmentCheck
     * Dependencies:
     *    ErgoUtils
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should check validness of commitments and return nothing since the commitments are incorrect
     */
    it('Should return empty array cause input is invalid', async () => {
      sinon
        .stub(ErgoUtils, 'commitmentFromObservation')
        .returns(Buffer.from(thirdCommitment.commitment));
      const data = cr.commitmentCheck([firstCommitment], observation, 1n);
      expect(data).to.have.length(0);
      sinon.restore();
    });

    /**
     * Target: testing commitmentCheck
     * Dependencies:
     *    ErgoUtils
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *   The function should check validness of commitments and return one valid commitment
     */
    // TODO: https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/113
    // it('Should return one valid commitment', async () => {
    //   sinon
    //     .stub(ErgoUtils, 'commitmentFromObservation')
    //     .returns(Buffer.from(firstCommitment.commitment, 'hex'));
    //   const data = cr.commitmentCheck([firstCommitment], observation, 1n);
    //   expect(data).to.have.length(1);
    //   expect(data[0]).to.eq(firstCommitment);
    //   sinon.restore();
    // });
  });

  describe('job', () => {
    /**
     * Target: testing reveal job
     * Dependencies:
     *    watcherUtils
     *    Boxes
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate used functions with inputs
     * Expected Output:
     *    The function should collect all ready commitment sets and check the commitment validation
     *    In case of enough valid commitments it should create the transaction
     */
    // TODO: https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/113
    // it('Should collect ready commitments and reveals the commitment by creating trigger event', async () => {
    //   const commitmentSet: CommitmentSet = {
    //     commitments: [firstCommitment, thirdCommitment],
    //     observation: observation,
    //   };
    //   chai.spy.on(watcherUtils, 'allReadyCommitmentSets', () => [
    //     commitmentSet,
    //   ]);
    //   chai.spy.on(boxes, 'getUserPaymentBox', () => plainBox);
    //   sinon.stub(ErgoNetwork, 'unspentErgoBoxById').resolves(WIDBox);
    //   sinon.stub(ErgoUtils, 'requiredCommitmentCount').returns(BigInt(1));
    //   chai.spy.on(cr, 'triggerEventCreationTx', () => 'txId');
    //   chai.spy.on(cr, 'commitmentCheck', () => [
    //     firstCommitment,
    //     thirdCommitment,
    //   ]);
    //   await cr.job();
    //   expect(boxes.getUserPaymentBox).to.have.called.once;
    //   expect(cr.triggerEventCreationTx).to.have.called.with(
    //     [WIDBox, WIDBox],
    //     observation,
    //     WIDs,
    //     plainBox
    //   );
    //   expect(cr.commitmentCheck).to.have.been.called.with(
    //     [firstCommitment, thirdCommitment],
    //     observation
    //   );
    //   sinon.restore();
    // });
  });
});
