import { Boxes } from '../../src/ergo/boxes';
import { expect } from 'chai';
import * as wasm from 'ergo-lib-wasm-nodejs';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import { ErgoUtils } from '../../src/ergo/utils';
import { ErgoNetwork } from '../../src/ergo/network/ergoNetwork';
import { hexStrToUint8Array } from '../../src/utils/utils';
import { tokens } from '../ergo/transactions/permit';
import { initMockedAxios } from '../ergo/objects/axios';
import { JsonBI } from '../../src/ergo/network/parser';
import { PermitEntity } from '@rosen-bridge/watcher-data-extractor';
import { BoxEntity } from '@rosen-bridge/address-extractor';
import { Buffer } from 'buffer';
import { Observation } from '../../src/utils/interfaces';
import { firstCommitment } from '../database/mockedData';
import { WatcherDataBase } from '../../src/database/models/watcherModel';
import { NotEnoughFund } from '../../src/errors/errors';

import chai from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import chaiPromise from 'chai-as-promised';

import permitObj from './dataset/permitBox.json' assert { type: 'json' };
import WIDObj from './dataset/WIDBox.json' assert { type: 'json' };
import plainObj from './dataset/plainBoxes.json' assert { type: 'json' };
import boxesObj from './dataset/boxes.json' assert { type: 'json' };
import { mockedResponseBody } from '../ergo/objects/mockedResponseBody';
import { beforeEach } from 'mocha';
import { getConfig } from '../../src/config/config';

const config = getConfig().general;
const permitJson = JsonBI.stringify(permitObj);
const WIDJson = JsonBI.stringify(WIDObj);
const plainJson = JsonBI.stringify(plainObj[0]);
const secondJson = JsonBI.stringify(plainObj[1]);
const thirdJson = JsonBI.stringify(boxesObj[0]);

chai.use(spies);
chai.use(chaiPromise);
initMockedAxios();

const permitBox: PermitEntity = new PermitEntity();
permitBox.boxSerialized = Buffer.from(
  wasm.ErgoBox.from_json(permitJson).sigma_serialize_bytes()
).toString('base64');
permitBox.boxId =
  '6ba81a7de39dce3303d100516bf80228e8c03464c130d5b0f8ff6f78f66bcbc8';

const WIDBox: BoxEntity = new BoxEntity();
WIDBox.serialized = Buffer.from(
  wasm.ErgoBox.from_json(WIDJson).sigma_serialize_bytes()
).toString('base64');
WIDBox.boxId =
  '2e24776266d16afbf23e7c96ba9c2ffb9bce25ea75d3ed9f2a9a3b2c84bf1655';

const plainBox: BoxEntity = new BoxEntity();
plainBox.serialized = Buffer.from(
  wasm.ErgoBox.from_json(plainJson).sigma_serialize_bytes()
).toString('base64');
plainBox.boxId =
  '57dc591ecba4c90f9116740bf49ffea2c7b73625f259e60ec0c23add86b14f47';

const secondBox: BoxEntity = new BoxEntity();
secondBox.serialized = Buffer.from(
  wasm.ErgoBox.from_json(secondJson).sigma_serialize_bytes()
).toString('base64');
secondBox.boxId =
  '9fac7bdf9db4c468d716b1be9f7468a26af2b7eb4a098b934185fd6aa6127c3e';

const thirdBox: BoxEntity = new BoxEntity();
thirdBox.serialized = Buffer.from(
  wasm.ErgoBox.from_json(thirdJson).sigma_serialize_bytes()
).toString('base64');
thirdBox.boxId =
  '87b988e426a1226bbbe7b42c7405d763cc4dd3d6f5a9fc8dbc4e67710163f442';

const WID = 'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b';
const permit =
  'EE7687i4URb4YuSGSQXPCb6iAFxAd5s8H1DLbUFQnSrJ8rED2KXdq8kUPQZ3pcPVFD97wQ32PATufWyvyhvit6sokNfLUNqp8wirq6L4H1WQSxYyL6gX7TeLTF2fRwqCvFDkcN6Z5StykpvKT4GrC9wa8DAu8nFre6VAnxMzE5DG3AVxir1pEWEKoLohsRCmKXGJu9jw58R1tE6Ff1LqqiaXbaAgkiyma9PA2Ktv41W6GutPKCmqSE6QzheE2i5c9uuUDRw3fr1kWefphpZVSmuCqNjuVU9fV73dtZE7jhHoXgTFRtHmGJS27DrHL9VvLyo7AP6bSgr4mAoYdF8UPTmcu4fFsMGFFJahLXm7V1qeqtsBXXEvRqQYEaSbMNRVmSZAe6jPhLVyqTBF9rLbYTCCjQXA6u7fu7JHn9xULHxsEjYdRuciVnnsk7RT5dDMM7YCC2yxnE7X8mZMekwceG3dj2triNPo7N6NbxNVSyw1jxaHJGHEza5PgUcieMqMvZyixuiu6PqA55GRCoCRek2pBcATifcyB2FJqtj';

export const firstObservation: Observation = {
  fromChain: 'erg',
  toChain: 'cardano',
  fromAddress: 'ErgoAddress',
  toAddress: 'cardanoAddress',
  amount: '1000000000',
  bridgeFee: '1000000',
  networkFee: '1000000',
  sourceChainTokenId: 'ergoTokenId',
  targetChainTokenId: 'cardanoTokenId',
  sourceTxId: 'ergoTxId1',
  sourceBlockId: 'ergoBlockId',
  requestId: 'reqId1',
  height: 1000,
};

describe('Testing Box Creation', () => {
  const value = BigInt(67500000000);
  let DB: WatcherDataBase, boxes: Boxes;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM);
    DB = ORM.DB;
    boxes = new Boxes(DB);
    const mempoolTrack = sinon.stub(ErgoNetwork, 'trackMemPool');
    mempoolTrack.onCall(1).resolves(wasm.ErgoBox.from_json(WIDJson));
    mempoolTrack.onCall(2).resolves(wasm.ErgoBox.from_json(plainJson));
  });

  afterEach(() => {
    chai.spy.restore();
  });

  describe('uniqueTrackedBoxes', () => {
    /**
     * Target: testing uniqueTrackedBoxes
     * Dependencies:
     *    watcherDatabase
     * Test Procedure:
     *    1- Mocking inputs
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return just one of the boxes
     */
    it('returns The unique ', async () => {
      const box1 = wasm.ErgoBox.from_json(permitJson);
      const box2 = wasm.ErgoBox.from_json(permitJson);
      const data = await boxes.uniqueTrackedBoxes([box1, box2]);
      expect(data).to.have.length(1);
      expect(data[0].box_id().to_str()).to.eq(box1.box_id().to_str());
    });
  });

  describe('getPermits', () => {
    beforeEach(() => {
      const box = wasm.ErgoBox.from_json(permitJson);
      chai.spy.on(DB, 'getUnspentPermitBoxes', () => [permitBox]);
      chai.spy.on(ErgoNetwork, 'trackMemPool', () => box);
      chai.spy.on(boxes, 'uniqueTrackedBoxes', () => [box]);
    });
    /**
     * Target: testing getPermits
     * Dependencies:
     *    watcherDatabase
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all unspent permits
     */
    it('returns one unspent permit ready to merge', async () => {
      const data = await boxes.getPermits(WID);
      expect(data).to.have.length(1);
      expect(data[0].box_id().to_str()).to.eq(permitBox.boxId);
    });

    /**
     * Target: testing getPermits
     * Dependencies:
     *    watcherDatabase
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all unspent permits which covers the required amount
     */
    it('returns one unspent permit ready to merge covering the required RWT count', async () => {
      const data = await boxes.getPermits(WID, 98n);
      expect(data).to.have.length(1);
      expect(data[0].box_id().to_str()).to.eq(permitBox.boxId);
    });

    /**
     * Target: testing getPermits
     * Dependencies:
     *    watcherDatabase
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should throws an error since watcher doesn't have enough permits
     */
    it('throws an error since there is no enough RWT', async () => {
      await expect(boxes.getPermits(WID, 100n)).to.rejectedWith(NotEnoughFund);
    });
  });

  /**
   * Target: testing getWIDBox
   * Dependencies:
   *    watcherDatabase
   *    ErgoNetwork
   * Test Procedure:
   *    1- Mocking environment
   *    2- calling function
   *    3- validate output
   * Expected Output:
   *    The function should return the unspent WID
   */
  describe('getWIDBox', () => {
    it('returns The watcher wid box', async () => {
      chai.spy.on(DB, 'getUnspentAddressBoxes', () => [WIDBox]);
      chai.spy.on(ErgoNetwork, 'trackMemPool', () =>
        wasm.ErgoBox.from_json(WIDJson)
      );
      const data = await boxes.getWIDBox(
        'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b'
      );
      expect(data[0].box_id().to_str()).to.eq(WIDBox.boxId);
    });
  });

  /**
   * Target: testing createWIDBox
   * Dependencies: None
   * Test Procedure:
   *   1- Calling function
   *   2- Validate output
   * Expected Output:
   *  Returned box should have proper creation height and token
   */
  describe('createWIDBox', () => {
    it('returns wid box', async () => {
      // chai.spy.on(boxes, 'getWIDBox', () => undefined);
      const WID =
        'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b';
      const data = boxes.createWIDBox(111, WID, '1000000', '1');
      expect(data.creation_height()).to.eq(111);
      expect(data.tokens().get(0).id().to_str()).to.eq(WID);
      expect(data.tokens().get(0).amount().as_i64().to_str()).to.eq('1');
      expect(data.value().as_i64().to_str()).to.eq('1000000');
    });
  });

  describe('getUserPaymentBox', () => {
    /**
     * Target: testing getUserPaymentBox
     * Dependencies:
     *    watcherDatabase
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should return all unspent watcher boxes
     */
    it('returns a covering plain boxesSample', async () => {
      chai.spy.on(DB, 'getUnspentAddressBoxes', () => [plainBox]);
      chai.spy.on(DB, 'trackTxQueue', () => wasm.ErgoBox.from_json(plainJson));
      chai.spy.on(ErgoNetwork, 'trackMemPool', () =>
        wasm.ErgoBox.from_json(plainJson)
      );
      const data = await boxes.getUserPaymentBox(value);
      expect(data).to.have.length(1);
      expect(data[0].box_id().to_str()).to.eq(plainBox.boxId);
    });

    /**
     * Target: testing getUserPaymentBox
     * Dependencies:
     *    watcherDatabase
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should throw an error since the required amount is not covered
     */
    it('throws an error not covering the required amount', async () => {
      chai.spy.on(DB, 'getUnspentAddressBoxes', () => [plainBox]);
      chai.spy.on(DB, 'trackTxQueue', () => wasm.ErgoBox.from_json(plainJson));
      chai.spy.on(ErgoNetwork, 'trackMemPool', () =>
        wasm.ErgoBox.from_json(plainJson)
      );
      const boxes = new Boxes(DB);
      await expect(boxes.getUserPaymentBox(value * BigInt(2))).to.rejectedWith(
        NotEnoughFund
      );
    });

    /**
     * Target: testing getUserPaymentBox
     * Dependencies:
     *    watcherDatabase
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should throw an error since the box is spent and the amount is not covered
     */
    it('should throw an error since the box is spent and the amount is not covered', async () => {
      chai.spy.on(DB, 'getUnspentAddressBoxes', () => [plainBox]);
      chai.spy.on(DB, 'trackTxQueue', () => wasm.ErgoBox.from_json(plainJson));
      chai.spy.on(ErgoNetwork, 'trackMemPool', () => undefined);
      const boxes = new Boxes(DB);
      await expect(boxes.getUserPaymentBox(value)).to.rejectedWith(
        NotEnoughFund
      );
    });

    /**
     * Target: testing boxIdsToOmit for getUserPaymentBox
     * Dependency:
     *    watcherDatabase
     *    ErgoNetwork
     * Test Procedure:
     *    1- mock getUnspentAddressBoxes to return 2 boxes
     *    2- mock trackMempool and trackTxQueue to return input box
     *    3- get userPaymentBox and omit first box data
     * Expected:
     *    return a list contain one box
     *    box must have same id as secondBox
     */
    it('should exclude box in return boxes', async () => {
      chai.spy.on(DB, 'getUnspentAddressBoxes', () => [plainBox, secondBox]);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);
      chai.spy.on(DB, 'trackTxQueue', (box: wasm.ErgoBox) => box);
      const data = await boxes.getUserPaymentBox(BigInt('1000000'), [
        plainBox.boxId,
      ]);
      expect(data).to.have.length(1);
      expect(data[0].box_id().to_str()).to.eq(secondBox.boxId);
    });

    /**
     * Target:
     * It should not include duplicate boxes when selecting boxes for payment
     *
     * Dependencies:
     * - database
     * - ErgoNetwork
     *
     * Scenario:
     * N/A
     *
     * Expected output:
     * An array of boxes without duplicate ones
     */
    it('should not include duplicate boxes when selecting boxes for payment', async () => {
      chai.spy.on(DB, 'getUnspentAddressBoxes', () => [
        plainBox,
        secondBox,
        thirdBox,
      ]);
      chai.spy.on(DB, 'trackTxQueue', (box: wasm.ErgoBox) =>
        wasm.ErgoBox.from_json(
          box.box_id().to_str() === thirdBox.boxId ? thirdJson : plainJson
        )
      );
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box: wasm.ErgoBox) => box);

      const selectedBox = await boxes.getUserPaymentBox(
        BigInt(plainObj[0].value + 1)
      );

      expect(selectedBox).to.have.length(2);
    });
  });

  describe('getRepoBox', () => {
    /**
     * Target: testing getRepoBox
     * Dependencies:
     *    ErgoNetwork
     * Test Procedure:
     *    1- Mocking environment
     *    2- calling function
     *    3- validate used functions with inputs
     * Expected Output:
     *    The function should return the repo box considering the mempool
     */
    it('should return repoBox (with tracking mempool)', async () => {
      initMockedAxios(1);
      const box = wasm.ErgoBox.from_json(
        mockedResponseBody.repoBoxWithWIDToken
      );
      chai.spy.on(ErgoNetwork, 'getBoxWithToken', () => box);
      chai.spy.on(ErgoNetwork, 'trackMemPool', (box) => box);
      await boxes.getRepoBox();
      expect(ErgoNetwork.getBoxWithToken).to.have.been.called.with(
        boxes.repoAddress,
        'a29d9bb0d622eb8b4f83a34c4ab1b7d3f18aaaabc3aa6876912a3ebaf0da1018'
      );
      expect(ErgoNetwork.trackMemPool).to.have.been.called.with(box);
    });
  });

  describe('createRepo', () => {
    /**
     * Target: testing createRepo
     * Expected Output:
     *    The function should return a new repo box with required information
     */
    it('checks repoBox tokens order and count', async () => {
      const RWTCount = '100';
      const RSNCount = '1';
      const AWCCount = '10';
      const repoBox = await boxes.createRepo(
        0,
        '1100000',
        RWTCount,
        RSNCount,
        AWCCount,
        new Uint8Array(),
        0
      );

      expect(repoBox.tokens().len()).to.be.equal(4);
      expect(repoBox.value().as_i64().to_str()).to.be.equal(config.minBoxValue);
      expect(repoBox.tokens().get(1).amount().as_i64().to_str()).to.be.equal(
        RWTCount
      );
      expect(repoBox.tokens().get(2).amount().as_i64().to_str()).to.be.equal(
        RSNCount
      );
      expect(repoBox.tokens().get(3).amount().as_i64().to_str()).to.be.equal(
        AWCCount
      );
      expect(repoBox.tokens().get(1).id().to_str()).to.be.equal(
        getConfig().rosen.RWTId
      );
      expect(repoBox.tokens().get(2).id().to_str()).to.be.equal(
        getConfig().rosen.RSN
      );
      expect(repoBox.tokens().get(3).id().to_str()).to.be.equal(
        getConfig().rosen.AWC
      );
    });
  });

  describe('createPermit', () => {
    /**
     * Target: testing createPermit
     * Expected Output:
     *    The function should return a new permit box with required information
     */
    it('checks permit box registers and tokens', async () => {
      const WID = hexStrToUint8Array(
        '4198da878b927fdd33e884d7ed399a3dbd22cf9d855ff5a103a50301e70d89fc'
      );
      const RWTCount = BigInt(100);
      const permitBox = await boxes.createPermit(1, RWTCount, WID);
      expect(permitBox.value().as_i64().to_str()).to.be.equal(
        config.minBoxValue
      );
      expect(permitBox.tokens().len()).to.be.equal(1);
      expect(permitBox.tokens().get(0).amount().as_i64().to_str()).to.be.equal(
        RWTCount.toString()
      );
      expect(permitBox.tokens().get(0).id().to_str()).to.be.equal(
        getConfig().rosen.RWTId
      );
      expect(permitBox.register_value(4)?.to_byte_array()).to.be.eql(WID);
    });
  });

  /**
   * createUserBoxCandidate function tests
   */
  describe('createUserBoxCandidate', () => {
    /**
     * Target: testing createUserBoxCandidate
     * Expected Output:
     *    The function should return a new user box with required information
     */
    it('checks userBox tokens and value', async () => {
      const tokensAmount = ['100', '1', '8000', '999000'];
      const amount = '11111111111';
      const tokenId = tokens[0];
      const tokenAmount = tokensAmount[0];
      const changeTokens = new Map<string, string>();
      for (let i = 1; i < 4; i++) {
        changeTokens.set(tokens[i], tokensAmount[i]);
      }

      const userBoxCandidate = await boxes.createUserBoxCandidate(
        1,
        '',
        amount,
        wasm.TokenId.from_str(tokenId),
        wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount)),
        changeTokens
      );

      expect(userBoxCandidate.value().as_i64().to_str()).to.be.equal(amount);
      expect(userBoxCandidate.tokens().len()).to.be.equal(4);
      const boxTokensId: Array<string> = [];
      const boxTokensAmount: Array<string> = [];
      for (let i = 0; i < 4; i++) {
        boxTokensId.push(userBoxCandidate.tokens().get(i).id().to_str());
        boxTokensAmount.push(
          userBoxCandidate.tokens().get(i).amount().as_i64().to_str()
        );
      }
      expect(boxTokensId).to.be.eql(tokens);
      expect(boxTokensAmount).to.be.eql(boxTokensAmount);
    });
  });

  describe('createCommitment', () => {
    /**
     * Target: testing createCommitment
     * Expected Output:
     *    The function should return a new commitment box with required information
     */
    it('tests the commitment box creation', async () => {
      const permitHash = ErgoUtils.contractHash(
        wasm.Contract.pay_to_address(wasm.Address.from_base58(permit))
      );
      const data = boxes.createCommitment(
        10,
        1n,
        WID,
        firstCommitment.eventId,
        Buffer.from(firstCommitment.commitment, 'hex'),
        permitHash
      );
      expect(BigInt(data.value().as_i64().to_str())).to.eql(
        BigInt(config.minBoxValue.toString())
      );
      expect(data.tokens().len()).to.eq(1);
      expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(1);
    });
  });

  describe('createTriggerEvent', () => {
    /**
     * Target: testing createTriggerEvent
     * Expected Output:
     *    The function should return a new trigger box with required information
     */
    it('tests the event trigger box creation', async () => {
      const data = boxes.createTriggerEvent(
        value,
        10,
        [WID, WID],
        firstObservation,
        2n
      );
      expect(BigInt(data.value().as_i64().to_str())).to.eql(value);
      expect(data.tokens().len()).to.eq(1);
      expect(data.tokens().get(0).amount().as_i64().as_num()).to.eq(2);
    });
  });
});
