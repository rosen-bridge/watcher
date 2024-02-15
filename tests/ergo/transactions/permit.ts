import { hexStrToUint8Array } from '../../../src/utils/utils';
import { expect } from 'chai';
import { initMockedAxios } from '../objects/axios';
import { Boxes } from '../../../src/ergo/boxes';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { boxesSample } from '../dataset/BoxesSample';

import chai from 'chai';
import spies from 'chai-spies';
import { Buffer } from 'buffer';
import { WatcherDataBase } from '../../../src/database/models/watcherModel';
import { mockedResponseBody } from '../objects/mockedResponseBody';
import { fillORM, loadDataBase } from '../../database/watcherDatabase';
import { ErgoNetwork } from '../../../src/ergo/network/ergoNetwork';
import TransactionTest from '../../../src/api/TransactionTest';
import { Transaction } from '../../../src/api/Transaction';
import { TxType } from '../../../src/database/entities/txEntity';
import { ErgoUtils } from '../../../src/ergo/utils';

chai.use(spies);

export const userAddress =
  '9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT';
export const RWTRepoAddress =
  'N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7';

export const tokens = [
  '4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8',
  'a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516',
  '34a217f1d2bc0f84607dad61c886de53f1ca919c389f184136f05a0de1d196f2',
  '2c966d5840c8725aff53414b3e60f494d4f1b79e642c9ef806e6536ec32f77f9',
];

export const secret1 = wasm.SecretKey.dlog_from_bytes(
  Buffer.from(
    '7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2',
    'hex'
  )
);
const secret2 = wasm.SecretKey.dlog_from_bytes(
  Buffer.from(
    '3edc2de69487617255c53bb1baccc9c73bd6ebe67fe702644ff6d92f2362e03e',
    'hex'
  )
);
const permitSecret = wasm.SecretKey.dlog_from_bytes(
  hexStrToUint8Array(
    'ed5242e13db8161b2079d4cb49cb9553d87e90b0898e44bc10b9b5d309dbac65'
  )
);
const watcherAddress = '9fadVRGYyiSBCgD7QtZU13BfGoDyTQ1oX918P8py22MJuMEwSuo';

initMockedAxios();

/**
 * requirements: an object of Transaction class, rosenConfig, userAddress, userSecret
 */
describe('Watcher Permit Transactions', () => {
  let DB: WatcherDataBase, boxes: Boxes;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    DB = ORM.DB;
    boxes = new Boxes(DB);
  });

  afterEach(() => {
    chai.spy.restore(boxes);
    TransactionTest.reset();
  });

  describe('getWID', () => {
    /**
     * Target: testing getWID for getting user WID
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return user WID
     */
    it('checks is there any wid in the usersBoxes', async () => {
      chai.spy.on(ErgoUtils, 'getWatcherBalance', () => ({
        tokens: [
          {
            tokenId: 'tokenId',
          },
          {
            tokenId: 'wid1',
          },
        ],
      }));
      chai.spy.on(Transaction, 'getWatcherState', () => undefined);
      await TransactionTest.setup(userAddress, secret1, boxes, DB);
      TransactionTest.getInstance();
      const WID = await TransactionTest.getWID(['wid1', 'wid2']);
      expect(WID).to.be.equal('wid1');
    });
  });

  describe('inputBoxesTokenMap', () => {
    /**
     * Target: testing inputBoxesTokenMap that should get all input boxes tokens
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    the token map of input and output should be the same
     */
    it('the token map of input and output should be the same', async () => {
      chai.spy.on(Transaction, 'getWatcherState', () => undefined);
      await TransactionTest.setup(userAddress, secret1, boxes, DB);
      const transaction = TransactionTest.getInstance();
      const ergoBoxes = wasm.ErgoBoxes.from_boxes_json([]);
      JSON.parse(mockedResponseBody.watcherUnspentBoxes).items.forEach(
        (box: JSON) => {
          const ergoBox = wasm.ErgoBox.from_json(JSON.stringify(box));
          ergoBoxes.add(ergoBox);
        }
      );
      let map = transaction.inputBoxesTokenMap(ergoBoxes, 0);
      expect(map.get(tokens[0])).to.be.equal('1');
      expect(map.get(tokens[1])).to.be.equal('100');
      expect(map.get(tokens[2])).to.be.equal('100');
      expect(map.get(tokens[3])).to.be.equal('100');
      map = transaction.inputBoxesTokenMap(ergoBoxes, 1);
      expect(map.get(tokens[1])).to.be.equal('100');
      expect(map.get(tokens[2])).to.be.equal('100');
      expect(map.get(tokens[3])).to.be.equal('100');
    });
  });

  /**
   * getPermit function tests
   */
  describe('getPermit', () => {
    afterEach(() => {
      chai.spy.restore();
    });

    /**
     * Target: testing that getPermit should sign a transaction with valid input
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     *    4- remove new record from database
     * Expected Output:
     *    getPermit with correct inputs and state should be signed
     *    should send transaction to txQueue
     */
    // it('checks get permit transaction is signed', async () => {
    //   initMockedAxios(0);
    //   chai.spy.on(boxes, 'getRepoBox', () => {
    //     return wasm.ErgoBox.from_json(mockedResponseBody.repoBox);
    //   });
    //   chai.spy.on(ErgoNetwork, 'getBoxWithToken', (address, tokenId) => {
    //     if (
    //       tokenId ===
    //       'a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516'
    //     )
    //       return wasm.ErgoBox.from_json(mockedResponseBody.watcherBox);
    //     else throw Error('No box with token');
    //   });
    //   await TransactionTest.setup(watcherAddress, permitSecret, boxes, DB);
    //   const secondTransaction = TransactionTest.getInstance();
    //   const response = await secondTransaction.getPermit(100n);
    //   expect(response.response).to.be.equal(
    //     'f2f48823e7b1131a6fe0d4b198dbe50493222689f3a223d2efa9b10ab063330a'
    //   );
    //   const permitTxs = await DB.getActivePermitTransactions();
    //   expect(permitTxs.length).to.be.equal(1);
    //   expect(permitTxs[0].txId).to.be.equal(
    //     'f2f48823e7b1131a6fe0d4b198dbe50493222689f3a223d2efa9b10ab063330a'
    //   );
    //
    //   await DB.removeTx(permitTxs[0]);
    // });

    /**
     * Target: testing that getPermit in case of invalid state should return error
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    getPermit with invalid state should return error
     */
    // it('tests that if watcher have permit box should returns error', async () => {
    //   chai.spy.on(boxes, 'getRepoBox', () => {
    //     return wasm.ErgoBox.from_json(mockedResponseBody.repoBoxWithPermit);
    //   });
    //
    //   chai.spy.on(ErgoNetwork, 'getBoxWithToken', () => {
    //     return wasm.ErgoBox.from_json(mockedResponseBody.watcherBox);
    //   });
    //
    //   await TransactionTest.setup(userAddress, secret1, boxes, DB);
    //   const transaction = TransactionTest.getInstance();
    //   const res = await transaction.getPermit(100n);
    //   expect(res.status).to.be.equal(500);
    // });

    /**
     * Target: getPermit should return error when an active permit
     *  transaction is already in queue
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- insert a permit tx into db
     *    3- calling function
     *    4- validate output
     *    5- remove permit tx into db
     * Expected Output:
     *    should return error
     */
    it('should return error when an active permit transaction is already in queue', async () => {
      await DB.submitTx('mockedTx', 'mockedTxId', TxType.PERMIT, 100);
      const mockedTx = (await DB.getActivePermitTransactions())[0];
      chai.spy.on(Transaction, 'getWatcherState', () => undefined);
      await TransactionTest.setup(userAddress, secret1, boxes, DB);
      const transaction = TransactionTest.getInstance();
      const res = await transaction.getPermit(100n);
      expect(res.status).to.be.equal(400);

      await DB.removeTx(mockedTx);
    });
  });

  /**
   * returnPermit function tests
   */
  describe('returnPermit', () => {
    /**
     * Target: testing that returnPermit in case of valid state and input should be signed return permit transaction
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    returnPermit transaction should be signed
     */
    // it('checks transaction is signed', async () => {
    //   initMockedAxios(0);
    //   chai.spy.on(boxes, 'getPermits', () => {
    //     return [wasm.ErgoBox.from_json(mockedResponseBody.permitBox)];
    //   });
    //   chai.spy.on(boxes, 'getRepoBox', () => {
    //     return wasm.ErgoBox.from_json(mockedResponseBody.repoBoxWithWIDToken);
    //   });
    //   chai.spy.on(ErgoNetwork, 'getBoxWithToken', (address, tokenId) => {
    //     if (tokenId === '6572676f')
    //       throw Error('There is no box with token id');
    //     return wasm.ErgoBox.from_json(
    //       mockedResponseBody.watcherBoxWithWIDToken
    //     );
    //   });
    //
    //   await TransactionTest.setup(watcherAddress, permitSecret, boxes, DB);
    //   const transaction = TransactionTest.getInstance();
    //
    //   const res = await transaction.returnPermit(100n);
    //   expect(res.response).to.be.equal(
    //     '5d2926187ccd2feb6ef526d7e6cd0efffe23c33b3fec26ab918cff75b7089fe5'
    //   );
    // });

    /**
     * Target: testing that returnPermit in case that return permit transaction have permit box in its output
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    returnPermit transaction should be signed in case that we have permit box in output
     */
    // TODO: https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/113
    // it('it checks case that the return permit transaction have permit box in its output', async () => {
    //   initMockedAxios(1);
    //   chai.spy.on(boxes, 'getPermits', () => {
    //     return [wasm.ErgoBox.from_json(mockedResponseBody.permitBox)];
    //   });
    //   chai.spy.on(boxes, 'getRepoBox', () => {
    //     return wasm.ErgoBox.from_json(mockedResponseBody.repoBoxWithWIDToken);
    //   });
    //   chai.spy.on(ErgoNetwork, 'getBoxWithToken', (address, tokenId) => {
    //     if (tokenId === '6572676f')
    //       throw Error('There is no box with token id');
    //     return wasm.ErgoBox.from_json(
    //       mockedResponseBody.watcherBoxWithWIDToken
    //     );
    //   });
    //   TransactionTest.reset();
    //   await TransactionTest.setup(watcherAddress, permitSecret, boxes, DB);
    //   const transaction = TransactionTest.getInstance();
    //
    //   const res = await transaction.returnPermit(1n);
    //   expect(res.response).to.be.equal(
    //     'cddc2ecb58dde47afbcbbb4a2281b0e71d5b1be7ae5a91506126c5efd4f6ac3b'
    //   );
    // });

    /**
     * Target: testing that returnPermit in case that watcher doesn't have permit box should return error
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    returnPermit should return error
     */
    it("tests that if watcher doesn't have permit box should returns error", async () => {
      initMockedAxios();
      chai.spy.on(boxes, 'getPermits', () => {
        return [wasm.ErgoBox.from_json(boxesSample.firstWatcherPermitBox)];
      });
      chai.spy.on(Transaction, 'getWatcherState', () => undefined);
      await TransactionTest.setup(
        '9hz7H7bxzcEYLd333TocbEHawk7YKzdCgCg1PAaQVUWG83tghQL',
        secret2,
        boxes,
        DB
      );
      const secondTransaction = TransactionTest.getInstance();
      const res = await secondTransaction.returnPermit(1n);
      expect(res.status).to.be.equal(400);
    });
  });

  /**
   * getWatcherState function tests
   */
  describe('getWatcherState', () => {
    /**
     * Target: testing getWatcherState when watcher gets permit
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    returnPermit should return true
     */
    it('should be true', async () => {
      chai.spy.on(DB, 'getAllWids', () => ['wid1', 'wid2']);
      chai.spy.on(ErgoUtils, 'getWatcherBalance', () => ({
        tokens: [
          {
            tokenId: 'tokenId',
          },
          {
            tokenId: 'wid1',
          },
        ],
      }));
      await TransactionTest.setup(watcherAddress, permitSecret, boxes, DB);
      const transaction = TransactionTest.getInstance();
      await TransactionTest.getWatcherState();
      expect(TransactionTest.watcherPermitState).to.be.true;
    });

    /**
     * Target: testing getWatcherState when watcher doesn't get permit
     * Dependencies:
     *    Transaction
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    returnPermit should return false
     */
    it('should be false', async () => {
      chai.spy.on(DB, 'getAllWids', () => ['wid1', 'wid2']);
      chai.spy.on(ErgoUtils, 'getWatcherBalance', () => ({
        tokens: [
          {
            tokenId: 'tokenId',
          },
          {
            tokenId: 'tokenId2',
          },
        ],
      }));
      await TransactionTest.setup(watcherAddress, permitSecret, boxes, DB);
      TransactionTest.getInstance();
      await TransactionTest.getWatcherState();
      expect(TransactionTest.watcherPermitState).to.be.false;
    });
  });
});
