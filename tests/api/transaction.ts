import { expect } from 'chai';
import { initMockedAxios } from '../ergo/objects/axios';
import * as wasm from 'ergo-lib-wasm-nodejs';
import sinon from 'sinon';
import chai from 'chai';
import spies from 'chai-spies';
import withdrawErg from '../ergo/transactions/dataset/withdrawErg.json' assert { type: 'json' };
import withdrawToken from '../ergo/transactions/dataset/withdrawToken.json' assert { type: 'json' };
import { secret1, userAddress } from '../ergo/transactions/permit';
import { mockedResponseBody } from '../ergo/objects/mockedResponseBody';
import { NotEnoughFund } from '../../src/errors/errors';
import { TxType } from '../../src/database/entities/txEntity';
import { JsonBI } from '../../src/ergo/network/parser';
import TransactionTest from '../../src/api/TransactionTest';
import { AddressBalance } from '../../src/ergo/interfaces';
import { WatcherDataBase } from '../../src/database/models/watcherModel';
import { Boxes } from '../../src/ergo/boxes';
import { ErgoNetwork } from '../../src/ergo/network/ergoNetwork';
import { ErgoUtils } from '../../src/ergo/utils';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import { Transaction } from '../../src/api/Transaction';
import { initializeTokens } from '../../src/config/config';

chai.use(spies);
const signedErgTx = wasm.Transaction.from_json(JsonBI.stringify(withdrawErg));
const signedTokenTx = wasm.Transaction.from_json(
  JsonBI.stringify(withdrawToken)
);

initMockedAxios();

describe('Transaction', () => {
  let watcherDb: WatcherDataBase, boxes: Boxes;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM, true);
    watcherDb = ORM.DB;
    boxes = new Boxes(watcherDb);
    chai.spy.on(boxes, 'getRepoBox', () => {
      return wasm.ErgoBox.from_json(mockedResponseBody.repoBoxWithWIDToken);
    });
    chai.spy.on(Transaction, 'getWatcherState', () => undefined);
    await TransactionTest.setup(userAddress, secret1, boxes, watcherDb);
    await initializeTokens()
  });

  afterEach(() => {
    sinon.restore();
    chai.spy.restore();
  });

  describe('withdrawFromWallet', () => {
    /**
     * @target Transactions.withdrawFromWallet should create erg tx
     * and call submitTransaction successfully
     * @dependencies
     * @scenario
     * - mock ErgoNetwork and ErgoUtils
     * - run the function
     * - check the result
     * @expected
     * - txUtils.submitTransaction should be called with signedTx and TxType.REDEEM
     */
    it('Transaction.withdrawFromWallet should create erg tx and call submitTransaction successfully', async () => {
      // mock ErgoNetwork and ErgoUtils
      sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedErgTx);
      chai.spy.on(
        TransactionTest.txUtils,
        'submitTransaction',
        (tx: any) => tx
      );

      // run the function
      const amount: AddressBalance = {
        nanoErgs: 1100000n,
        tokens: [],
      };
      const address = '9gwWZGZgZhGjp1ZKNQ5rtxNELamz6trq9tigDsKRy71boWq3Fqq';
      await TransactionTest.getInstance().withdrawFromWallet(amount, address);

      // check the result
      expect(TransactionTest.txUtils.submitTransaction).to.have.called.with(
        signedErgTx,
        TxType.REDEEM
      );
    });

    /**
     * @target Transactions.withdrawFromWallet should create token tx
     * and call submitTransaction successfully
     * @dependencies
     * @scenario
     * - mock ErgoNetwork and ErgoUtils
     * - run the function
     * - check the result
     * @expected
     * - txUtils.submitTransaction should be called with signedTx and TxType.REDEEM
     */
    it('Transaction.withdrawFromWallet should create token tx and call submitTransaction successfully', async () => {
      // mock ErgoNetwork and ErgoUtils
      sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedTokenTx);
      chai.spy.on(
        TransactionTest.txUtils,
        'submitTransaction',
        (tx: any) => tx
      );

      // run the function
      const amount: AddressBalance = {
        nanoErgs: 1100000n,
        tokens: [
          {
            tokenId:
              '844e3cf44b3181b4cacbccbf7596d341f41147d73daf4b565ecaac983aba2508',
            amount: 200n,
          },
        ],
      };
      const address = '9gwWZGZgZhGjp1ZKNQ5rtxNELamz6trq9tigDsKRy71boWq3Fqq';
      await TransactionTest.getInstance().withdrawFromWallet(amount, address);

      // check the result
      expect(TransactionTest.txUtils.submitTransaction).to.have.called.with(
        signedTokenTx,
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
    it('Transaction.withdrawFromWallet should throw error when erg is not enough', async () => {
      // mock ErgoNetwork and ErgoUtils
      sinon.stub(ErgoNetwork, 'getHeight').resolves(111);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);
      sinon.stub(ErgoUtils, 'createAndSignTx').resolves(signedErgTx);

      // run the function and expect the error
      const amount: AddressBalance = {
        nanoErgs: 1861100000n,
        tokens: [],
      };
      const address = '9gwWZGZgZhGjp1ZKNQ5rtxNELamz6trq9tigDsKRy71boWq3Fqq';
      await expect(
        TransactionTest.getInstance().withdrawFromWallet(amount, address)
      ).to.rejectedWith(
        NotEnoughFund,
        'Not enough fund to create the transaction. Uncovered value: 2200000, Uncovered assets: []'
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
    it('Transaction.withdrawFromWallet should throw error when token is not enough', async () => {
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
