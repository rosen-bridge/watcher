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
import WIDObj from './dataset/WIDBox3.json' assert { type: 'json' };
import { CommitmentEntity } from '@rosen-bridge/watcher-data-extractor';

chai.use(spies);

const feeBox1 = wasm.ErgoBox.from_json(JsonBI.stringify(feeBoxObj1));
const WIDBox = wasm.ErgoBox.from_json(JsonBI.stringify(WIDObj));

const userAddress = '9h4gxtzV1f8oeujQUA5jeny1mCUCWKrCWrFUJv6mgxsmp5RxGb9';
const rwtID =
  '8e5b02ba729ad364867619d2a8b9ff1438190c14979a12aa0a249e996194f074';
const WID = '72eadf8bef7d2597cda26de0fb673616b44a66a3adc7ab57c6cfcac6a68ef639';

export const commitment = new CommitmentEntity();
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
    await Transaction.setup(userAddress, secret1, boxes);
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
     */
    it('Should create, sign and send a commitment redeem tx without any extra tokens', async () => {
      chai.spy.on(txUtils, 'submitTransaction', () => null);
      chai.spy.on(boxes, 'createPermit');
      chai.spy.on(boxes, 'createWIDBox');
      chai.spy.on(ErgoUtils, 'getExtraTokenCount');
      sinon.stub(boxes, 'RWTTokenId').value(wasm.TokenId.from_str(rwtID));
      sinon.stub(ErgoNetwork, 'getHeight').resolves(999999);
      await cr.redeemCommitmentTx(
        WID,
        WIDBox,
        decodeSerializedBox(commitment.boxSerialized),
        [feeBox1],
        2200000n
      );
      expect(boxes.createPermit).to.have.called.with.exactly(
        999999,
        BigInt(1),
        hexStrToUint8Array(WID)
      );
      expect(ErgoUtils.getExtraTokenCount).to.have.called.once;
      expect(boxes.createWIDBox).not.to.have.called;
    });
  });
  //   /**
  //    * @target CommitmentRedeem.job should collect ready observations and create commitments
  //    * @dependencies
  //    * - WatcherUtils
  //    * - Boxes
  //    * - Transaction
  //    * @scenario
  //    * - mock allReadyObservations to return the mocked observation
  //    * - mock getPermits to return the mocked permit
  //    * - mock getWIDBox to return the mocked WIDBox
  //    * - mock detachWID
  //    * - mock getUserPaymentBox
  //    * - mock WatcherWID to return the correct test WID
  //    * - mock createCommitmentTx
  //    * - run test
  //    * - check calling createCommitmentTx
  //    * - check not calling detach tx
  //    * - check not calling getUserPaymentBox
  //    * @expected
  //    * - it should not call DetachWID.detachWIDtx since the WID token is the first token of WIDBox
  //    * - It should not call getUserPaymentBox since the box values is enough
  //    * - It should call the commitment tx with correct input values
  //    */
  //   it('Should collect ready observations and create commitments', async () => {
  //     chai.spy.on(watcherUtils, 'allReadyObservations', () => [commitment]);
  //     chai.spy.on(watcherUtils, 'updateObservation', () => {
  //       return;
  //     });
  //     chai.spy.on(boxes, 'getPermits', () => permits);
  //     chai.spy.on(boxes, 'getWIDBox', () => WIDBox);
  //     chai.spy.on(boxes, 'getUserPaymentBox');
  //     chai.spy.on(DetachWID, 'detachWIDtx', () => '');
  //     sinon.stub(Transaction, 'watcherWID').value(WID);
  //     chai.spy.on(cr, 'createCommitmentTx', () => {
  //       return { txId: 'txId', commitmentBoxId: 'boxId' };
  //     });
  //     await cr.job();
  //     // Total value is enough should not call paymentBox
  //     expect(boxes.getUserPaymentBox).to.not.have.called();
  //     expect(cr.createCommitmentTx).to.have.called.with(
  //       WID,
  //       commitment,
  //       commitment,
  //       permits,
  //       WIDBox,
  //       []
  //     );
  //     expect(DetachWID.detachWIDtx).to.not.have.been.called();
  //   });

  //   /**
  //    * Target: testing job
  //    * Dependencies:
  //    *    WatcherUtils
  //    *    Boxes
  //    *    Transaction
  //    * Test Procedure:
  //    *    1- Mocking environment
  //    *    2- calling function
  //    *    3- validate used functions with inputs
  //    * Expected Output:
  //    *    The function should collect all ready observations to create the commitment transaction
  //    *    Since the box values is not enough should use an excess fee box covering the tx fee
  //    */
  //   it('Should collect ready observations and create commitment with excess fee box', async () => {
  //     chai.spy.on(watcherUtils, 'allReadyObservations', () => [commitment]);
  //     chai.spy.on(watcherUtils, 'updateObservation', () => {
  //       return;
  //     });
  //     chai.spy.on(boxes, 'getPermits', () => permits);
  //     chai.spy.on(boxes, 'getWIDBox', () => WIDBoxWithoutErg);
  //     chai.spy.on(boxes, 'getUserPaymentBox', () => plainBox);
  //     sinon.stub(Transaction, 'watcherWID').value(WID);
  //     chai.spy.on(cr, 'createCommitmentTx', () => {
  //       return { txId: 'txId', commitmentBoxId: 'boxId' };
  //     });
  //     await cr.job();
  //     // Total value is not enough for the transaction
  //     expect(boxes.getUserPaymentBox).to.have.called.once;
  //     expect(cr.createCommitmentTx).to.have.called.with(
  //       WID,
  //       commitment,
  //       commitment,
  //       permits,
  //       WIDBoxWithoutErg,
  //       plainBox
  //     );
  //   });

  //   /**
  //    * @target CommitmentRedeem.job should call wid detach and skip the commitment creation
  //    * @dependencies
  //    * - WatcherUtils
  //    * - Boxes
  //    * - Transaction
  //    * @scenario
  //    * - mock detachWID
  //    * - mock allReadyObservations to return the mocked observation
  //    * - mock getPermits to return the mocked permit
  //    * - mock getWIDBox to return the mocked WIDBox
  //    * - mock WatcherWID to return a different token id
  //    * - mock createCommitmentTx
  //    * - run test
  //    * - check calling detach tx
  //    * - check not calling createCommitmentTx
  //    * @expected
  //    * - it should call DetachWID.detachWIDtx
  //    * - should skip the rest of the process
  //    */
  //   it('Should call wid detach and skip the commitment creation', async () => {
  //     chai.spy.on(DetachWID, 'detachWIDtx', () => '');
  //     chai.spy.on(watcherUtils, 'allReadyObservations', () => [commitment]);
  //     chai.spy.on(boxes, 'getPermits', () => permits);
  //     chai.spy.on(boxes, 'getWIDBox', () => WIDBoxWithoutErg);
  //     sinon.stub(Transaction, 'watcherWID').value('differentWID');
  //     chai.spy.on(cr, 'createCommitmentTx', () => {
  //       return { txId: 'txId', commitmentBoxId: 'boxId' };
  //     });
  //     await cr.job();
  //     expect(DetachWID.detachWIDtx).to.have.called();
  //     expect(cr.createCommitmentTx).to.not.have.called;
  //   });
  // });
});
