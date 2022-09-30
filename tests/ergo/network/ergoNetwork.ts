import { ErgoNetwork } from '../../../src/ergo/network/ergoNetwork';
import { mockedResponseBody } from '../objects/mockedResponseBody';
import { RWTRepoAddress, userAddress } from '../transactions/permit';
import {
  boxId,
  confirmedTxId,
  initMockedAxios,
  unavailableTxId,
  unconfirmedTxId,
} from '../objects/axios';

import * as wasm from 'ergo-lib-wasm-nodejs';
import { expect } from 'chai';
import { JsonBI } from '../../../src/ergo/network/parser';

initMockedAxios();
import txObj from '../transactions/dataset/commitmentTx.json' assert { type: 'json' };
const tx = wasm.Transaction.from_json(JSON.stringify(txObj));
import txObj2 from '../dataset/tx.json' assert { type: 'json' };
const tx2 = wasm.Transaction.from_json(JSON.stringify(txObj2));

/**
 * Ergo Network class tests
 */
describe('Ergo Network(API)', () => {
  /**
   * getHeight function tests
   */
  describe('getHeight', () => {
    /**
     * it should last block height
     */
    it('should return last block height', async () => {
      const res = await ErgoNetwork.getHeight();
      expect(res).to.equal(215809);
    });
  });

  /**
   * getBoxesForAddress function tests
   */
  describe('getBoxesForAddress', () => {
    /**
     * should return `AddressBoxes` instance with the offset set to 0
     */
    it('should return `AddressBoxes` instance offset=0', async () => {
      const res = await ErgoNetwork.getBoxesForAddress(
        '0008cd03c880d703131f301badf289ceb9b7f86d674e8cbe390461f66e844f507571a1d6',
        0,
        1
      );
      expect(res).to.eql(
        JsonBI.parse(mockedResponseBody.firstWatcherLastUnspentBox)
      );
    });

    /**
     * should return emptyAddressBox instance with the offset set to 1
     */
    it('should return emptyAddressBox instance offset=1', async () => {
      const res = await ErgoNetwork.getBoxesForAddress(
        '0008cd03c880d703131f301badf289ceb9b7f86d674e8cbe390461f66e844f507571a1d6',
        1,
        1
      );
      expect(res).to.eql(JsonBI.parse(mockedResponseBody.emptyAddressBox));
    });
  });

  /**
   * getLastBlockHeader function tests
   */
  describe('getLastBlockHeader', () => {
    /**
     * should return last 10 block headers
     */
    it('should return last 10 block headers', async () => {
      const res = await ErgoNetwork.getLastBlockHeader();
      expect(res).to.be.eql(mockedResponseBody.last10BlockHeaders);
    });
  });

  /**
   * sendTx function tests
   */
  describe('sendTx', () => {
    /**
     * the transaction should be accepted by node and the txId should return
     */
    it('should return txId', async () => {
      const res = (await ErgoNetwork.sendTx(
        mockedResponseBody.sampleTxJson
      )) as { txId: string };
      expect(res.txId).to.be.equal(mockedResponseBody.sampleTxId);
    });
  });

  /**
   * getErgoStateContext function tests
   */
  describe('getErgoStateContext', () => {
    /**
     * should return ErgoStateContext without error
     */
    it('should return ErgoStateContext without error', async () => {
      await ErgoNetwork.getErgoStateContext();
    });
  });

  /**
   * getCoveringErgAndTokenForAddress function tests
   */
  describe('getCoveringErgAndTokenForAddress', () => {
    /**
     * checks that function returns covering boxesSample(ERG) correctly with assertions
     */
    it('test covering erg ', async () => {
      const res = await ErgoNetwork.getCoveringErgAndTokenForAddress(
        '0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30',
        BigInt('94500000') + BigInt('10000000')
      );
      expect(res.covered).to.be.true;
      expect(res.boxes.length).to.be.equal(3);
    });

    /**
     * checks that function returns covering boxesSample(Token) correctly with assertions
     */
    it('test covering tokens', async () => {
      const res = await ErgoNetwork.getCoveringErgAndTokenForAddress(
        '0008cd03c29ad59831be2e5baded45a03ce9a7d4c2e83d683e11c79790e76f640d0d3e30',
        BigInt('100000'),
        {
          ['a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516']:
            100n,
        }
      );
      expect(res.covered).to.be.true;
      expect(res.boxes.length).to.be.equal(2);
    });
  });

  /**
   * getBoxWithToken function tests
   */
  describe('getBoxWithToken', () => {
    /**
     * it should return box with NFT in it
     */
    it('returns box with NFT in it', async () => {
      const res = await ErgoNetwork.getBoxWithToken(
        wasm.Address.from_mainnet_str(userAddress),
        '4911d8b1e96bccba5cbbfe2938578b3b58a795156518959fcbfc3bd7232b35a8'
      );
      expect(res.box_id().to_str()).to.be.equal(
        '3ac7e967200368b6a95f0714d24f830161fb0d5c7c173beae316969687ba98af'
      );
    });
  });

  /**
   * getErgBox function tests
   */
  describe('getErgBox', () => {
    /**
     * the function should return covering boxesSample with enough erg in it
     */
    it('get covering Erg without any covering token', async () => {
      const res = await ErgoNetwork.getErgBox(
        wasm.Address.from_mainnet_str(userAddress),
        BigInt('20000000')
      );
      expect(res.length).to.be.equal(2);
    });
  });

  /**
   * trackMemPool function tests
   */
  describe('trackMemPool', () => {
    /**
     * should return last box in the mempool the assertion is on boxid
     */
    it('should return last box in the mempool', async () => {
      const ergoBox = wasm.ErgoBox.from_json(mockedResponseBody.unspentBox);
      const res = await ErgoNetwork.trackMemPool(ergoBox);
      expect(res.box_id().to_str()).to.be.equal(
        '2afbd9393fb1ddb982e9d82a269e27b1b97184c1bc45451d5c63dae28d25d708'
      );
    });

    /**
     * Target: testing trackMempool
     * Expected Output:
     *    The function should return null since the box is spent and nothing similar were created in the tx
     */
    it('should return null since the box is spent', async () => {
      const ergoBox = wasm.ErgoBox.from_json(mockedResponseBody.unspentBox2);
      const res = await ErgoNetwork.trackMemPool(ergoBox);
      expect(res).to.be.undefined;
    });
  });

  /**
   * getMemPoolTxForAddress function tests
   */
  describe('getMemPoolTxForAddress', () => {
    /**
     * should return mempool transactions
     */
    it('should return mempool transactions', async () => {
      const res = await ErgoNetwork.getMemPoolTxForAddress(RWTRepoAddress);
      expect(res.total).to.be.equal(1);
    });
  });

  /**
   * boxById function tests
   */
  describe('boxById', () => {
    /**
     * should return the box with the specified id
     */
    it('should return a box', async () => {
      const res = await ErgoNetwork.boxById(boxId);
      expect(res.box_id().to_str()).to.eql(boxId);
    });
  });

  /**
   * txStatus function tests
   */
  describe('txStatus', () => {
    /**
     * transaction is in mempool:
     *  getConfirmedTx should return null
     *  getUnconfirmedTx should return the transaction
     *  and getConfNum should return 0
     */
    it('Tests mempool transaction status', async () => {
      const confirmed = await ErgoNetwork.getConfirmedTx(unconfirmedTxId);
      expect(confirmed).to.null;
      const unconfirmed = await ErgoNetwork.getUnconfirmedTx(unconfirmedTxId);
      expect(unconfirmed).to.haveOwnProperty('id');
      const confNum = await ErgoNetwork.getConfNum(unconfirmedTxId);
      expect(confNum).to.eql(0);
    });

    /**
     * transaction is in mempool:
     *  getConfirmedTx should return the transaction
     *  getUnconfirmedTx should return null
     *  and getConfNum should return the confirmation count
     */
    it('Tests confirmed transaction status', async () => {
      const confirmed = await ErgoNetwork.getConfirmedTx(confirmedTxId);
      expect(confirmed).to.haveOwnProperty('id');
      const unconfirmed = await ErgoNetwork.getUnconfirmedTx(confirmedTxId);
      expect(unconfirmed).to.null;
      const confNum = await ErgoNetwork.getConfNum(confirmedTxId);
      expect(confNum).to.eql(6539);
    });

    /**
     * transaction is unavailable:
     *  and getConfNum should return -1
     */
    it('Tests unavailable transaction status', async () => {
      const confNum = await ErgoNetwork.getConfNum(unavailableTxId);
      expect(confNum).to.eql(-1);
    });
  });

  /**
   * txInputsCheck function tests
   */
  describe('txInputsCheck', () => {
    /**
     * The function checks the inputs and return false if any of them is spent
     */
    it('Returns false because tx inputs are spent', async () => {
      const data = await ErgoNetwork.checkTxInputs(tx.inputs());
      expect(data).to.false;
    });
    /**
     * The function should return true cause all inputs are unspent
     */
    it('Returns true because tx inputs are all unspent', async () => {
      const data = await ErgoNetwork.checkTxInputs(tx2.inputs());
      expect(data).to.true;
    });
  });
});
