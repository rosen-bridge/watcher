import { Boxes } from '../../../src/ergo/boxes';
import { Transaction } from '../../../src/api/Transaction';
import { secret1 } from './permit';
import { CommitmentRedeem } from '../../../src/transactions/commitmentRedeem';
import { JsonBI } from '../../../src/ergo/network/parser';
import { ErgoUtils, decodeSerializedBox } from '../../../src/ergo/utils';
import { ErgoNetwork } from '../../../src/ergo/network/ergoNetwork';
import { hexStrToUint8Array } from '../../../src/utils/utils';
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

import feeBoxObj1 from './dataset/feeBox1.json' assert { type: 'json' };
import feeBoxObj2 from './dataset/feeBox2.json' assert { type: 'json' };
import WIDObj from './dataset/WIDBox3.json' assert { type: 'json' };
import WIDObj2 from './dataset/WIDBox4.json' assert { type: 'json' };
import WIDObjWithoutErg from './dataset/WIDBoxWithoutErg.json' assert { type: 'json' };
import { CommitmentEntity } from '@rosen-bridge/watcher-data-extractor';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { fail } from 'assert';
import { DetachWID } from '../../../src/transactions/detachWID';
import { TxStatus } from '../../../src/database/entities/observationStatusEntity';

chai.use(spies);

const feeBox1 = wasm.ErgoBox.from_json(JsonBI.stringify(feeBoxObj1));
const feeBox2 = wasm.ErgoBox.from_json(JsonBI.stringify(feeBoxObj2));
const WIDBox = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj));
const WIDBox2 = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj2));
const WIDBoxWithoutErg = wasm.ErgoBox.from_json(
  JsonBI.stringify(WIDObjWithoutErg)
);

const userAddress = '9h4gxtzV1f8oeujQUA5jeny1mCUCWKrCWrFUJv6mgxsmp5RxGb9';
const rwtID =
  '8e5b02ba729ad364867619d2a8b9ff1438190c14979a12aa0a249e996194f074';
const WID = '72eadf8bef7d2597cda26de0fb673616b44a66a3adc7ab57c6cfcac6a68ef639';

const observation: ObservationEntity = new ObservationEntity();
observation.id = 2;
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
  'f6bc60c6e5c5c195eaf1e2a7fea88f155d7a1f7f263b099983426985356559be';
observation.toAddress = 'ergoAddress';
observation.height = 123;
observation.fromAddress =
  'addr_test1vzg07d2qp3xje0w77f982zkhqey50gjxrsdqh89yx8r7nasu97hr0';

const commitment = new CommitmentEntity();
commitment.id = 9;
commitment.extractor = 'cardanoCommitment';
commitment.eventId =
  'f6bc60c6e5c5c195eaf1e2a7fea88f155d7a1f7f263b099983426985356559be';
commitment.boxSerialized =
  '4JFDEB4EAA4gtkJxzAvXMsp1fO7wW/CTIRFS5Y2O+3R/5UgbsnAv5M8EAAIAAgAEAgQAAQAEAAQABAAEAAQABAYEBAQCBQIFyAEEAAQABQAEAgQABAACAAQABAAEAgQABADYC9YBsqRzAADWAnMB1gOTy8JyAXIC1gTkxqcEGtYFlXIDcgGypXMCANYG5MZyBQQa1gfGcgUFGtYI5nIH1gmVcgiw5HIHgwECcwPZAQk8Dg6zjHIJAYxyCQKDAQJzBNYKtHIJcwWxcgnWC7KlcwYAlXID2AHWDLK1pdkBDGPYAdYOxnIMBBqV5nIOk+RyDnIEcwdzCADRloMEAZPLwnIM5ManBw6TjLLbYwhyDHMJAAGMsttjCKdzCgAB765yBtkBDQ6TcgSDAQ5yDZPLs3IKsnIEcwsA5ManBg7YAdYMy8JyC5WTcgxyAtgJ1g21pNkBDWOTwqfCcg3WDrFyBtYPsXIN1hCy22UB/nMMANYR5MZyEAYR1hKychFzDQDWE5qychFzDgCdnLJyEXMPAJl+seTGchAEGgVzEHMR1hSy22MIcgVzEgDWFbLbYwincxMA0ZaDCgGSwXILsK1yDdkBFmPBchZzFNkBFlmajHIWAYxyFgKTsbVyDdkBFmOT5MZyFgQacgRzFa5yBtkBFg6TgwEOchZyBJPkxnIFBg7kxqcHDpNyDnIPk8uzcgqycgRzFgDkxqcGDpPkxqcFGoMBDpVyCMuy5HIHcxcAgwECcxiRfnIPBZWPchJyE3ISchOTjHIUAYxyFQGSjHIUApyMchUCfnIOBdGWgwUBk8WnxXIBk4yy22MIcgtzGQABjLLbYwincxoAAZPkxnILBBpyBJOMsttjCLKkcxsAcxwAAbJyBHMdAJNyDOTGpwcOh90OAY5bArpymtNkhnYZ0qi5/xQ4GQwUl5oSqgoknplhlPB0AQQaASBy6t+L730ll82ibeD7ZzYWtEpmo63Hq1fGz8rGpo72ORoBIPa8YMblxcGV6vHip/6ojxVdeh9/JjsJmYNCaYU1ZVm+DiDlENLk+ydq/zDOCBzFbh99Y+zv8aUggowJByOa2C90CQ4gEqjrdr0AZT2ibZrzo2YNWH3b6Q9Utx7JpQUiLqoAlTSJhwGm5p+U1rr5hXdkmQ+dvuaeni766ZRKdU/ellThnAA=';
commitment.commitment =
  'e510d2e4fb276aff30ce081cc56e1f7d63eceff1a520828c0907239ad82f7409';
commitment.WID =
  '72eadf8bef7d2597cda26de0fb673616b44a66a3adc7ab57c6cfcac6a68ef639';
commitment.boxId =
  '68335c8c2443b08f9d6875435ac469a118fb124a0a5b328fc233d27c07022ef9';
commitment.block =
  '2be3efe69535d3aaae0bf073c3af65013ea326e5e82bf3483c80188aa5261aec';
commitment.height = 989449;
commitment.spendBlock = '';
commitment.spendHeight = undefined;

describe('Commitment redeem transaction tests', () => {
  let watcherDb: WatcherDataBase,
    txUtils: TransactionUtils,
    boxes: Boxes,
    watcherUtils: WatcherUtils;
  let cr: CommitmentRedeem;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    watcherDb = ORM.DB;
    boxes = new Boxes(watcherDb);
    chai.spy.on(boxes, 'getRepoBox', () => WIDBox);
    await Transaction.setup(userAddress, secret1, boxes, watcherDb);
    watcherUtils = new WatcherUtils(watcherDb, 0, 100);
    txUtils = new TransactionUtils(watcherDb);
    cr = new CommitmentRedeem(watcherUtils, txUtils, boxes, 20);
  });

  afterEach(() => {
    chai.spy.restore(watcherUtils);
    sinon.restore();
  });

  describe('redeemCommitmentTx', () => {
    /**
     * @target redeemCommitmentTx should create, sign and send a
     * commitment redeem tx without any extra tokens
     * @dependencies
     * - WatcherUtils
     * - Boxes
     * - Transaction
     * @scenario
     * - mock environment (RWTTokenId, getHeight and createAndSignTx)
     * - call function
     * - validate used functions with inputs
     * @expected
     * - it should construct a valid commitment redeem tx
     * - it should also sign and send it successfully
     * - it should not call createWIDBox
     * - it should return new WID box
     *   - tokenId should equal to WID
     *   - ergoTree should equal to spent WID box ergoTree
     */
    // TODO: https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/113
    // it('should create, sign and send a commitment redeem tx without any extra tokens', async () => {
    //   chai.spy.on(txUtils, 'submitTransaction', () => null);
    //   chai.spy.on(boxes, 'createPermit');
    //   chai.spy.on(boxes, 'createWIDBox');
    //   chai.spy.on(ErgoUtils, 'getExtraTokenCount');
    //   sinon.stub(boxes, 'RWTTokenId').value(wasm.TokenId.from_str(rwtID));
    //   sinon.stub(ErgoNetwork, 'getHeight').resolves(999999);
    //   const res = await cr.redeemCommitmentTx(
    //     WID,
    //     observation,
    //     WIDBox,
    //     decodeSerializedBox(commitment.boxSerialized),
    //     [feeBox1],
    //     3300000n
    //   );
    //   expect(boxes.createPermit).to.have.called.with.exactly(
    //     999999,
    //     1n,
    //     hexStrToUint8Array(WID)
    //   );
    //   expect(ErgoUtils.getExtraTokenCount).to.have.called.once;
    //   expect(boxes.createWIDBox).not.to.have.called;
    //   expect(res.tokens().get(0).id().to_str()).to.equal(WID);
    //   expect(res.ergo_tree().to_base16_bytes()).to.equal(
    //     WIDBox.ergo_tree().to_base16_bytes()
    //   );
    // });
    /**
     * @target redeemCommitmentTx should create, sign and send a
     * commitment redeem tx with extra tokens
     * @dependencies
     * - WatcherUtils
     * - Boxes
     * - Transaction
     * @scenario
     * - mock environment (RWTTokenId, getHeight and createAndSignTx)
     * - call function
     * - validate used functions with inputs
     * @expected
     * - it should construct a valid commitment redeem tx
     * - it should also sign and send it successfully
     * - it should call createWIDBox
     * - it should return new WID box
     *   - tokenId should equal to WID
     *   - ergoTree should equal to spent WID box ergoTree
     */
    // TODO: https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/113
    // it('should create, sign and send a commitment redeem tx with extra tokens', async () => {
    //   chai.spy.on(txUtils, 'submitTransaction', () => null);
    //   chai.spy.on(boxes, 'createPermit');
    //   chai.spy.on(boxes, 'createWIDBox');
    //   chai.spy.on(ErgoUtils, 'getExtraTokenCount');
    //   sinon.stub(boxes, 'RWTTokenId').value(wasm.TokenId.from_str(rwtID));
    //   sinon.stub(ErgoNetwork, 'getHeight').resolves(999999);
    //   const res = await cr.redeemCommitmentTx(
    //     WID,
    //     observation,
    //     WIDBox,
    //     decodeSerializedBox(commitment.boxSerialized),
    //     [feeBox2],
    //     3300000n
    //   );
    //   expect(boxes.createPermit).to.have.called.with.exactly(
    //     999999,
    //     1n,
    //     hexStrToUint8Array(WID)
    //   );
    //   expect(boxes.createWIDBox).to.have.called.with.exactly(
    //     999999,
    //     WID,
    //     '997800000'
    //   );
    //   expect(ErgoUtils.getExtraTokenCount).to.have.called.once;
    //   expect(res.tokens().get(0).id().to_str()).to.equal(WID);
    //   expect(res.ergo_tree().to_base16_bytes()).to.equal(
    //     WIDBox.ergo_tree().to_base16_bytes()
    //   );
    // });
    /**
     * @target redeemCommitmentTx should throw error when Erg is not enough
     * @dependencies
     * - WatcherUtils
     * - Boxes
     * - Transaction
     * @scenario
     * - mock environment (RWTTokenId, getHeight and createAndSignTx)
     * - call function and expect exception to be thrown
     * @expected
     * - it should throw error
     * - it should should not send the transaction to sign
     */
    // TODO: https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/113
    // it('should throw error when Erg is not enough', async () => {
    //   chai.spy.on(ErgoUtils, 'createAndSignTx');
    //   sinon.stub(boxes, 'RWTTokenId').value(wasm.TokenId.from_str(rwtID));
    //   sinon.stub(ErgoNetwork, 'getHeight').resolves(999999);
    //   try {
    //     await cr.redeemCommitmentTx(
    //       WID,
    //       observation,
    //       WIDBox,
    //       decodeSerializedBox(commitment.boxSerialized),
    //       [],
    //       3300000n
    //     );
    //     fail(`No exception has been thrown`);
    //   } catch {
    //     expect(ErgoUtils.createAndSignTx).to.not.have.called;
    //   }
    // });
  });

  describe('job', () => {
    afterEach(() => {
      chai.spy.restore(watcherUtils);
      sinon.restore();
    });

    /**
     * @target redeemCommitmentTx.job should collect timeout commitments and redeem them
     * @dependencies
     * - WatcherUtils
     * - Boxes
     * - Transaction
     * @scenario
     * - mock allTimeoutCommitments to return the mocked commitment
     * - mock allCommitedObservations to return the mocked observation with status
     * - mock getWIDBox to return the mocked WIDBox
     * - mock getUserPaymentBox
     * - mock detachWID
     * - mock WatcherWID to return the correct test WID
     * - mock redeemCommitmentTx
     * - run test
     * - check calling redeemCommitmentTx
     * - check not calling detach tx
     * - check not calling getUserPaymentBox
     * @expected
     * - it should not call DetachWID.detachWIDtx since the WID token is the first token of WIDBox
     * - it should not call getUserPaymentBox since the box values is enough
     * - it should call the commitment tx with correct input values
     */
    it('should collect a timeout commitment and redeem them', async () => {
      chai.spy.on(watcherUtils, 'allTimeoutCommitments', () => [commitment]);
      chai.spy.on(watcherUtils, 'allCommitedObservations', () => [
        { observation: observation, status: TxStatus.COMMITTED },
      ]);
      chai.spy.on(boxes, 'getWIDBox', () => WIDBox2);
      chai.spy.on(boxes, 'getUserPaymentBox');
      chai.spy.on(DetachWID, 'detachWIDtx', () => '');
      sinon.stub(Transaction, 'watcherWID').value(WID);
      chai.spy.on(cr, 'redeemCommitmentTx', () => WIDBox);
      await cr.job();
      // Total value is enough should not call paymentBox
      expect(cr.redeemCommitmentTx).to.have.been.called();
      expect(DetachWID.detachWIDtx).to.not.have.been.called();
      expect(boxes.getUserPaymentBox).to.not.have.called();
    });

    /**
     * @target redeemCommitmentTx.job should collect timeout commitments and redeem them
     * with additional fee boxes
     * @dependencies
     * - WatcherUtils
     * - Boxes
     * - Transaction
     * @scenario
     * - mock allTimeoutCommitments to return the mocked commitment
     * - mock allCommitedObservations to return the mocked observation with status
     * - mock getWIDBox to return the mocked WIDBox
     * - mock getUserPaymentBox
     * - mock detachWID
     * - mock WatcherWID to return the correct test WID
     * - mock redeemCommitmentTx
     * - run test
     * - check calling redeemCommitmentTx
     * - check not calling detach tx
     * - check calling getUserPaymentBox
     * @expected
     * - it should not call DetachWID.detachWIDtx since the WID token is the first token of WIDBox
     * - it should call getUserPaymentBox
     * - it should call the commitment tx with correct input values
     */
    it('should collect a timeout commitment and redeem them with additional fee boxes', async () => {
      chai.spy.on(watcherUtils, 'allTimeoutCommitments', () => [commitment]);
      chai.spy.on(watcherUtils, 'allCommitedObservations', () => [
        { observation: observation, status: TxStatus.COMMITTED },
      ]);
      chai.spy.on(boxes, 'getWIDBox', () => WIDBox);
      chai.spy.on(boxes, 'getUserPaymentBox', () => [feeBox1]);
      chai.spy.on(DetachWID, 'detachWIDtx', () => '');
      sinon.stub(Transaction, 'watcherWID').value(WID);
      chai.spy.on(cr, 'redeemCommitmentTx', () => WIDBox2);
      await cr.job();
      // Total value is NOT enough. Should call paymentBox
      expect(cr.redeemCommitmentTx).to.have.been.called();
      expect(DetachWID.detachWIDtx).to.not.have.been.called();
      expect(boxes.getUserPaymentBox).to.have.called.once;
    });

    /**
     * @target redeemCommitmentTx.job should chain commitment redeem transactions
     * @dependencies
     * - WatcherUtils
     * - Boxes
     * - Transaction
     * @scenario
     * - mock allTimeoutCommitments to return two the mocked commitment
     * - mock allCommitedObservations to return the mocked observation with status
     * - mock getWIDBox to return the mocked WIDBox
     * - mock getUserPaymentBox
     * - mock detachWID
     * - mock WatcherWID to return the correct test WID
     * - mock redeemCommitmentTx
     * - run test
     * - check calling redeemCommitmentTx
     * - check not calling detach tx
     * - check calling getUserPaymentBox
     * @expected
     * - it should not call DetachWID.detachWIDtx since the WID token is the first token of WIDBox
     * - it should call getUserPaymentBox
     * - it should call the commitment tx twice
     */
    it('should chain commitment redeem transactions', async () => {
      chai.spy.on(watcherUtils, 'allTimeoutCommitments', () => [
        commitment,
        commitment,
      ]);
      chai.spy.on(watcherUtils, 'allCommitedObservations', () => [
        { observation: observation, status: TxStatus.COMMITTED },
      ]);
      chai.spy.on(boxes, 'getWIDBox', () => WIDBox);
      chai.spy.on(boxes, 'getUserPaymentBox', () => [feeBox1]);
      chai.spy.on(DetachWID, 'detachWIDtx', () => '');
      sinon.stub(Transaction, 'watcherWID').value(WID);
      chai.spy.on(cr, 'redeemCommitmentTx');
      await cr.job();
      expect(cr.redeemCommitmentTx).to.have.been.called.twice;
      expect(DetachWID.detachWIDtx).to.not.have.been.called();
      expect(boxes.getUserPaymentBox).to.have.called.twice;
    });

    /**
     * @target redeemCommitmentTx.job should call wid detach and skip the commitment redeem
     * @dependencies
     * - WatcherUtils
     * - Boxes
     * - Transaction
     * @scenario
     * - mock detachWID
     * - mock allTimeoutCommitments to return two the mocked commitment
     * - mock allCommitedObservations to return the mocked observation with status
     * - mock getWIDBox to return the mocked WIDBox
     * - mock WatcherWID to return a different token id
     * - mock createCommitmentTx
     * - run test
     * - check calling detach tx
     * - check not calling redeemCommitmentTx
     * @expected
     * - it should call DetachWID.detachWIDtx
     * - should skip the rest of the process
     */
    it('Should call wid detach and skip the commitment redeem', async () => {
      chai.spy.on(DetachWID, 'detachWIDtx', () => '');
      chai.spy.on(watcherUtils, 'allTimeoutCommitments', () => [commitment]);
      chai.spy.on(watcherUtils, 'allCommitedObservations', () => [
        { observation: observation, status: TxStatus.COMMITTED },
      ]);
      chai.spy.on(boxes, 'getWIDBox', () => WIDBoxWithoutErg);
      sinon.stub(Transaction, 'watcherWID').value('differentWID');
      chai.spy.on(cr, 'redeemCommitmentTx');
      await cr.job();
      expect(DetachWID.detachWIDtx).to.have.called();
      expect(cr.redeemCommitmentTx).to.not.have.called;
    });
  });
});
