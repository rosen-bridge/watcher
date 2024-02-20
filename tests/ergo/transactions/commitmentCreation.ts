import { Buffer } from 'buffer';
import { Boxes } from '../../../src/ergo/boxes';
import { Transaction } from '../../../src/api/Transaction';
import { secret1 } from './permit';
import { CommitmentCreation } from '../../../src/transactions/commitmentCreation';
import { JsonBI } from '../../../src/ergo/network/parser';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { ErgoUtils } from '../../../src/ergo/utils';
import { ErgoNetwork } from '../../../src/ergo/network/ergoNetwork';
import { hexStrToUint8Array } from '../../../src/utils/utils';
import { TxType } from '../../../src/database/entities/txEntity';
import { WatcherDataBase } from '../../../src/database/models/watcherModel';
import { fillORM, loadDataBase } from '../../database/watcherDatabase';
import {
  TransactionUtils,
  WatcherUtils,
} from '../../../src/utils/watcherUtils';

import * as wasm from 'ergo-lib-wasm-nodejs';
import { expect } from 'chai';
import chai from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import permitObj from './dataset/permitBox.json' assert { type: 'json' };
import permitObj2 from './dataset/permitBox2.json' assert { type: 'json' };
import permitObj3 from './dataset/permitBox3.json' assert { type: 'json' };
import WIDObj from './dataset/WIDBox.json' assert { type: 'json' };
import WIDObj2 from './dataset/WIDBoxWithoutErg.json' assert { type: 'json' };
import plainObj from './dataset/plainBox.json' assert { type: 'json' };
import txObj from './dataset/commitmentTx.json' assert { type: 'json' };
import repoBox1Obj from './dataset/repoBox1.json' assert { type: 'json' };

chai.use(spies);

const permits = [wasm.ErgoBox.from_json(JsonBI.stringify(permitObj))];
const permits2 = [wasm.ErgoBox.from_json(JsonBI.stringify(permitObj2))];
const permits3 = [wasm.ErgoBox.from_json(JsonBI.stringify(permitObj3))];
const WIDBox = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj));
const WIDBoxWithoutErg = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj2));
const plainBox = [wasm.ErgoBox.from_json(JsonBI.stringify(plainObj))];
const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj));
const repoBox1 = wasm.ErgoBox.from_json(JSON.stringify(repoBox1Obj));

const userAddress = '9h4gxtzV1f8oeujQUA5jeny1mCUCWKrCWrFUJv6mgxsmp5RxGb9';
const rwtID =
  '469255244f7b12ea7d375ec94ec8d2838a98be0779c8231ece3529ae69c421db';
const WID = 'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b';

export const observation: ObservationEntity = new ObservationEntity();
observation.id = 33;
observation.fromChain = 'CARDANO';
observation.toChain = 'ERGO';
observation.bridgeFee = '10000';
observation.networkFee = '10000';
observation.amount = '10';
observation.sourceChainTokenId = 'asset12y0ewmxggeglymjpmp9mjf5qzh4kgwj9chtkpv';
observation.targetChainTokenId = 'cardanoTokenId';
observation.sourceTxId =
  'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa';
observation.sourceBlockId =
  '93395496d590ec6db0f2fd13a7bcf91e82a9f230ef677f6216ea8c9f57df6ab3';
observation.requestId =
  'cf32ad374daefdce563e3391effc4fc42eb0e74bbec8afe16a46eeea69e3b2aa';
observation.toAddress = 'ergoAddress';
observation.height = 123;
observation.fromAddress =
  'addr_test1vzg07d2qp3xje0w77f982zkhqey50gjxrsdqh89yx8r7nasu97hr0';

const commitment = ErgoUtils.commitmentFromObservation(observation, WID);

describe('Commitment creation transaction tests', () => {
  let watcherDb: WatcherDataBase,
    txUtils: TransactionUtils,
    boxes: Boxes,
    watcherUtils: WatcherUtils;
  let cc: CommitmentCreation;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    watcherDb = ORM.DB;
    boxes = new Boxes(watcherDb);
    chai.spy.on(boxes, 'getRepoBox', () => repoBox1);
    await Transaction.setup(userAddress, secret1, boxes, watcherDb);
    watcherUtils = new WatcherUtils(watcherDb, 0, 100);
    txUtils = new TransactionUtils(watcherDb);
    cc = new CommitmentCreation(watcherUtils, txUtils, boxes);
  });

  afterEach(() => {
    chai.spy.restore(watcherUtils);
  });

  describe('createCommitmentTx', () => {
    /**
     * Target: testing createCommitmentTx without any extra tokens
     * Dependencies:
     *    WatcherUtils
     *    Boxes
     *    Transaction
     * Test Procedure:
     *    1- Mocking environment (RWTTokenId, getHeight and createAndSignTx)
     *    2- calling function
     *    3- validate used functions with inputs
     * Expected Output:
     *    The function should construct a valid commitment creation tx
     *    It should also sign and send it successfully
     *    It should not call createWIDBox
     */
    it('Should create, sign and send a commitment transaction without any extra tokens', async () => {
      chai.spy.on(txUtils, 'submitTransaction', () => null);
      chai.spy.on(boxes, 'createCommitment');
      chai.spy.on(boxes, 'createPermit');
      chai.spy.on(boxes, 'createWIDBox');
      chai.spy.on(ErgoUtils, 'getExtraTokenCount');
      sinon.stub(boxes, 'RWTTokenId').value(wasm.TokenId.from_str(rwtID));
      sinon.stub(ErgoNetwork, 'getMaxHeight').resolves(111);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedTx);
      await cc.createCommitmentTx(
        WID,
        observation,
        commitment,
        permits,
        WIDBox,
        [],
        100000000n
      );
      expect(boxes.createPermit).to.have.called.with.exactly(
        111,
        BigInt(97),
        hexStrToUint8Array(WID)
      );
      expect(boxes.createCommitment).to.have.called.once;
      expect(txUtils.submitTransaction).to.have.been.called.with.exactly(
        signedTx,
        TxType.COMMITMENT,
        observation
      );
      expect(ErgoUtils.getExtraTokenCount).to.have.called.once;
      expect(boxes.createWIDBox).not.to.have.called;

      sinon.restore();
    });

    /**
     * Target: testing createCommitmentTx with one extra token
     * Dependencies:
     *    WatcherUtils
     *    Boxes
     *    Transaction
     * Test Procedure:
     *    1- Mocking environment (RWTTokenId and getHeight)
     *    2- calling function
     * Expected Output:
     *   Should call createWIDBox with specified parameters
     */
    // TODO: https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/113
    // it('Should create, sign and send a commitment transaction with extra tokens', async () => {
    //   chai.spy.on(boxes, 'createWIDBox');
    //   sinon.stub(boxes, 'RWTTokenId').value(wasm.TokenId.from_str(rwtID));
    //   sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
    //   await cc.createCommitmentTx(
    //     WID,
    //     observation,
    //     commitment,
    //     permits2,
    //     WIDBox,
    //     [],
    //     100000000n
    //   );
    //
    //   expect(boxes.createWIDBox).to.have.called.once;
    //   expect(boxes.createWIDBox).to.have.called.with(111, WID);
    //
    //   sinon.restore();
    // });

    /**
     * Target: testing createCommitmentTx with one extra token
     * Dependencies:
     *    WatcherUtils
     *    Boxes
     *    Transaction
     * Test Procedure:
     *    1- Mocking environment (RWTTokenId and getHeight)
     *    2- calling function
     * Expected Output:
     *   Should log a not enough fund error due to erg insufficiency
     */
    // TODO: https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/113
    // it('Should throw error while creating commitment transaction', async () => {
    //   chai.spy.on(ErgoUtils, 'createAndSignTx');
    //   sinon.stub(boxes, 'RWTTokenId').value(wasm.TokenId.from_str(rwtID));
    //   sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
    //   await cc.createCommitmentTx(
    //     WID,
    //     observation,
    //     commitment,
    //     permits3,
    //     WIDBoxWithoutErg,
    //     [],
    //     100000000n
    //   );
    //   expect(ErgoUtils.createAndSignTx).to.not.called;
    //   sinon.restore();
    // });
  });

  describe('job', () => {
    /**
     * @target CommitmentCreation.job should collect ready observations and create commitments
     * @dependencies
     * - WatcherUtils
     * - Boxes
     * - Transaction
     * @scenario
     * - mock allReadyObservations to return the mocked observation
     * - mock getPermits to return the mocked permit
     * - mock getWIDBox to return the mocked WIDBox
     * - mock detachWID
     * - mock getUserPaymentBox
     * - mock WatcherWID to return the correct test WID
     * - mock createCommitmentTx
     * - run test
     * - check calling createCommitmentTx
     * - check not calling detach tx
     * - check not calling getUserPaymentBox
     * @expected
     * - it should not call DetachWID.detachWIDtx since the WID token is the first token of WIDBox
     * - It should not call getUserPaymentBox since the box values is enough
     * - It should call the commitment tx with correct input values
     */
    it('Should collect ready observations and create commitments', async () => {
      chai.spy.on(watcherUtils, 'allReadyObservations', () => [observation]);
      chai.spy.on(watcherUtils, 'updateObservation', () => {
        return;
      });
      chai.spy.on(boxes, 'getPermits', () => permits);
      chai.spy.on(boxes, 'getWIDBox', () => [WIDBox]);
      chai.spy.on(boxes, 'getUserPaymentBox');
      sinon.stub(Transaction, 'watcherWID').value(WID);
      chai.spy.on(cc, 'createCommitmentTx', () => {
        return { txId: 'txId', commitmentBoxId: 'boxId' };
      });
      await cc.job();
      // Total value is enough should not call paymentBox
      expect(boxes.getUserPaymentBox).to.not.have.called();
      expect(cc.createCommitmentTx).to.have.called.with(
        WID,
        observation,
        commitment,
        permits,
        WIDBox,
        []
      );
    });

    /**
     * Target: testing job
     * Dependencies:
     *    WatcherUtils
     *    Boxes
     *    Transaction
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate used functions with inputs
     * Expected Output:
     *    The function should collect all ready observations to create the commitment transaction
     *    Since the box values is not enough should use an excess fee box covering the tx fee
     */
    it('Should collect ready observations and create commitment with excess fee box', async () => {
      chai.spy.on(watcherUtils, 'allReadyObservations', () => [observation]);
      chai.spy.on(watcherUtils, 'updateObservation', () => {
        return;
      });
      chai.spy.on(boxes, 'getPermits', () => permits);
      chai.spy.on(boxes, 'getWIDBox', () => [WIDBoxWithoutErg]);
      chai.spy.on(boxes, 'getUserPaymentBox', () => plainBox);
      sinon.stub(Transaction, 'watcherWID').value(WID);
      chai.spy.on(cc, 'createCommitmentTx', () => {
        return { txId: 'txId', commitmentBoxId: 'boxId' };
      });
      await cc.job();
      // Total value is not enough for the transaction
      expect(boxes.getUserPaymentBox).to.have.called.once;
      expect(cc.createCommitmentTx).to.have.called.with(
        WID,
        observation,
        commitment,
        permits,
        WIDBoxWithoutErg,
        plainBox
      );
    });
  });
});
