import { hexStrToUint8Array } from '../../../src/utils/utils';
import { expect } from 'chai';
import { initMockedAxios } from '../objects/axios';
import { Boxes } from '../../../src/ergo/boxes';
import * as wasm from 'ergo-lib-wasm-nodejs';
import sinon from 'sinon';
import { ErgoUtils } from '../../../src/ergo/utils';
import chai from 'chai';
import spies from 'chai-spies';
import { Buffer } from 'buffer';
import { WatcherDataBase } from '../../../src/database/models/watcherModel';
import { fillORM, loadDataBase } from '../../database/watcherDatabase';
import { ErgoNetwork } from '../../../src/ergo/network/ergoNetwork';
import { TransactionUtils } from '../../../src/utils/watcherUtils';
import withdrawErg from '../transactions/dataset/withdrawErg.json' assert { type: 'json' };
import { JsonBI } from '../../../src/ergo/network/parser';
import { AddressBalance } from '../../../src/ergo/interfaces';
import TransactionTest from '../../../src/api/TransactionTest';
import { secret1, userAddress } from './permit';
import { TxType } from '../../../src/database/entities/txEntity';
import { NotEnoughFund } from '../../../src/errors/errors';

chai.use(spies);
const signedErgTx = wasm.Transaction.from_json(JsonBI.stringify(withdrawErg));

initMockedAxios();

describe('Admin Transactions', () => {
  let watcherDb: WatcherDataBase, txUtils: TransactionUtils, boxes: Boxes;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    watcherDb = ORM.DB;
    boxes = new Boxes(watcherDb);
    txUtils = new TransactionUtils(watcherDb);
    await TransactionTest.setup(userAddress, secret1, boxes, txUtils, false);
  });

  afterEach(() => {
    sinon.restore();
    chai.spy.restore();
  });

  describe('withdrawFromWallet', () => {
    /**
     * @target Transactions.withdrawFromWallet should create tx successfully
     * @dependencies
     * @scenario
     * - mock ErgoNetwork and ErgoUtils
     * - run the function
     * - check the result
     * @expected
     * - txUtils.submitTransaction should be called with signedTx and TxType.REDEEM
     */
    it('Transactions.withdrawFromWallet should create tx successfully', async () => {
      // mock ErgoNetwork and ErgoUtils
      sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedErgTx);
      chai.spy.on(txUtils, 'submitTransaction', (tx: any) => tx);

      // run the function
      const amount: AddressBalance = {
        nanoErgs: 1100000n,
        tokens: [],
      };
      const address = '9gwWZGZgZhGjp1ZKNQ5rtxNELamz6trq9tigDsKRy71boWq3Fqq';
      await TransactionTest.getInstance().withdrawFromWallet(amount, address);

      // check the result
      expect(txUtils.submitTransaction).to.have.called.with(
        signedErgTx,
        TxType.REDEEM
      );
    });

    /**
     * @target Transactions.withdrawFromWallet should throw error when erg is not enough
     * @dependencies
     * @scenario
     * - mock ErgoNetwork and ErgoUtils
     * - run the function and expect the error
     * @expected
     * - should throw error of type NotEnoughFund and specific message
     */
    it('Transactions.withdrawFromWallet should throw error when erg is not enough', async () => {
      // mock ErgoNetwork and ErgoUtils
      sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedErgTx);

      // run the function and expect the error
      const amount: AddressBalance = {
        nanoErgs: 1200000n,
        tokens: [],
      };
      const address = '9gwWZGZgZhGjp1ZKNQ5rtxNELamz6trq9tigDsKRy71boWq3Fqq';
      await expect(
        TransactionTest.getInstance().withdrawFromWallet(amount, address)
      ).to.rejectedWith(
        NotEnoughFund,
        'Not enough fund to create the transaction. Uncovered value: 100000, Uncovered assets: []'
      );
    });

    /**
     * @target Transactions.withdrawFromWallet should throw error when token is not enough
     * @dependencies
     * @scenario
     * - mock ErgoNetwork and ErgoUtils
     * - run the function and expect the error
     * @expected
     * - should throw error of type NotEnoughFund and specific message
     */
    it('Transactions.withdrawFromWallet should throw error when token is not enough', async () => {
      // mock ErgoNetwork and ErgoUtils
      sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedErgTx);

      // run the function and expect the error
      const amount: AddressBalance = {
        nanoErgs: 1100000n,
        tokens: [
          {
            tokenId: 'a',
            amount: 1n,
          },
        ],
      };
      const address = '9gwWZGZgZhGjp1ZKNQ5rtxNELamz6trq9tigDsKRy71boWq3Fqq';
      await expect(
        TransactionTest.getInstance().withdrawFromWallet(amount, address)
      ).to.rejectedWith(
        NotEnoughFund,
        'Not enough fund to create the transaction. Uncovered value: 0, Uncovered assets: [{"tokenId":"a","value":1}]'
      );
    });
  });
});
