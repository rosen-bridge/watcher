import chai, { expect } from 'chai';
import spies from 'chai-spies';
import { AdminActions } from '../../../src/transactions/adminActions';
import { WatcherDataBase } from '../../../src/database/models/watcherModel';
import { TransactionUtils } from '../../../src/utils/watcherUtils';
import { Boxes } from '../../../src/ergo/boxes';
import { fillORM, loadDataBase } from '../../database/watcherDatabase';
import { Transaction } from '../../../src/api/Transaction';
import sinon from 'sinon';
import { ErgoNetwork } from '../../../src/ergo/network/ergoNetwork';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { ErgoUtils } from '../../../src/ergo/utils';
import txObj from './dataset/withdrawErg.json' assert { type: 'json' };
import { JsonBI } from '../../../src/ergo/network/parser';
import { AddressBalance } from '../../../src/ergo/interfaces';
import { TxType } from '../../../src/database/entities/txEntity';

chai.use(spies);

const signedTx = wasm.Transaction.from_json(JsonBI.stringify(txObj));

describe('AdminActions', () => {
  let watcherDb: WatcherDataBase, txUtils: TransactionUtils, boxes: Boxes;
  let admin: AdminActions;

  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    watcherDb = ORM.DB;
    boxes = new Boxes(watcherDb);
    // await Transaction.setup(userAddress, secret1, boxes);
    txUtils = new TransactionUtils(watcherDb);
    await AdminActions.setup(txUtils, boxes);
    admin = AdminActions.getInstance();
  });

  describe('withdrawFromWallet', () => {
    /**
     * @target AdminActions.withdrawFromWallet should create tx successfully
     * @dependencies
     * @scenario
     * - mock ErgoNetwork and ErgoUtils
     * - run the function
     * - check the result
     * @expected
     * - txUtils.submitTransaction should be called with signedTx and TxType.REDEEM
     */
    it('AdminActions.withdrawFromWallet should create tx successfully', async () => {
      // mock ErgoNetwork and ErgoUtils
      sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedTx);
      chai.spy.on(txUtils, 'submitTransaction', (tx: Transaction) => tx);

      // run the function
      const amount: AddressBalance = {
        nanoErgs: 1100000n,
        tokens: [],
      };
      const address = '9gwWZGZgZhGjp1ZKNQ5rtxNELamz6trq9tigDsKRy71boWq3Fqq';
      await admin.withdrawFromWallet(amount, address);

      // check the result
      expect(txUtils.submitTransaction).to.have.called.with(
        signedTx,
        TxType.REDEEM
      );
    });
  });

  afterEach(() => {
    sinon.restore();
  });
});
