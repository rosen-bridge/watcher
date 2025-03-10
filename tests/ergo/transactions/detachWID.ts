import { testBoxes } from './testBoxes';
import { Boxes } from '../../../src/ergo/boxes';
import { Transaction } from '../../../src/api/Transaction';
import { WatcherDataBase } from '../../../src/database/models/watcherModel';
import { fillORM, loadDataBase } from '../../database/watcherDatabase';
import { TransactionUtils } from '../../../src/utils/watcherUtils';
import chai from 'chai';
import { DetachWID } from '../../../src/transactions/detachWID';
import { ErgoUtils } from '../../../src/ergo/utils';
import { ErgoNetwork } from '../../../src/ergo/network/ergoNetwork';
import sinon from 'sinon';
import { expect } from 'chai';
import { JsonBI } from '../../../src/ergo/network/parser';
import * as wasm from 'ergo-lib-wasm-nodejs';
import txObj from './dataset/commitmentTx.json' assert { type: 'json' };
import { TxType } from '../../../src/database/entities/txEntity';
import { TokensConfig } from '../../../src/config/tokensConfig';
import { getConfig } from '../../../src/config/config';

const WID = 'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b';
const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj));

describe('DetachWID', () => {
  let watcherDb: WatcherDataBase, txUtils: TransactionUtils, boxes: Boxes;

  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    watcherDb = ORM.DB;
    boxes = new Boxes(watcherDb);
    txUtils = new TransactionUtils(watcherDb);
    await Transaction.setup(
      getConfig().general.address,
      getConfig().general.secretKey,
      boxes,
      watcherDb
    );

  });

  afterEach(() => {
    sinon.restore();
    chai.spy.restore();
  });

  /**
   * @target DetachWID.detachWIDTx should create and submit a detach wid transaction
   * @dependencies
   * - TxUtils
   * - Boxes
   * @scenario
   * - mock WID box
   * - mock SubmitTransaction
   * - mock getHeight
   * - mock createAndSignTx
   * - mock getUserPaymentBox
   * - run test
   * - check submitted transaction
   * - check using excess fee boxes
   * @expected
   * - it should call submitTransaction with signedTx and TxType.DETACH
   * - should not use extra fee boxes
   */
  it('should create and submit a detach wid transaction', async () => {
    const widBox = testBoxes.WidBoxWithWrongOrder(WID);
    chai.spy.on(txUtils, 'submitTransaction', () => null);
    sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
    sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedTx);
    chai.spy.on(boxes, 'getUserPaymentBox');

    await DetachWID.detachWIDtx(txUtils, boxes, WID, [widBox]);

    expect(txUtils.submitTransaction).to.have.been.called.with.exactly(
      signedTx,
      TxType.DETACH
    );
    expect(boxes.getUserPaymentBox).to.not.have.been.called();
  });

  /**
   * @target DetachWID.detachWIDTx should create and submit a detach wid transaction
   * and use extra fee boxes when the WID Box doesn't have enough amount
   * @dependencies
   * - TxUtils
   * - Boxes
   * @scenario
   * - mock WID box
   * - mock SubmitTransaction
   * - mock getHeight
   * - mock createAndSignTx
   * - mock getUserPaymentBox to return a proper box with enough erg
   * - run test
   * - check submitted transaction
   * - check using excess fee boxes
   * @expected
   * - it should call submitTransaction with signedTx and TxType.DETACH
   * - should use extra fee boxes to cover the tx fee
   */

  it("should create and submit a detach wid transaction and use extra fee boxes when the WID Box doesn't have enough amount", async () => {
    const address = wasm.Address.from_base58(getConfig().general.address);
    const widBox = testBoxes.WidBoxWithWrongOrderWithoutErg(WID);
    chai.spy.on(txUtils, 'submitTransaction', () => null);
    sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
    sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedTx);
    chai.spy.on(boxes, 'getUserPaymentBox', () => {
      return [
        testBoxes.mockSingleBox(
          '11000000',
          [],
          wasm.Contract.new(address.to_ergo_tree())
        ),
      ];
    });

    await DetachWID.detachWIDtx(txUtils, boxes, WID, [widBox]);

    expect(txUtils.submitTransaction).to.have.been.called.with.exactly(
      signedTx,
      TxType.DETACH
    );
    expect(boxes.getUserPaymentBox).to.have.been.called();
  });
});
