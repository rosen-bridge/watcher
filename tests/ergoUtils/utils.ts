import { Observation } from '../../src/utils/interfaces';
import { ErgoUtils, extractBoxes } from '../../src/ergo/utils';
import { uint8ArrayToHex } from '../../src/utils/utils';
import { ChangeBoxCreationError } from '../../src/errors/errors';
import { ErgoNetwork } from '../../src/ergo/network/ergoNetwork';
import { Address } from 'ergo-lib-wasm-nodejs';
import { initMockedAxios } from '../ergo/objects/axios';

import * as wasm from 'ergo-lib-wasm-nodejs';
import { expect } from 'chai';
import chai from 'chai';
import spies from 'chai-spies';

import boxesJson from './dataset/boxes.json' assert { type: 'json' };
import permitBox from './dataset/permitBox.json' assert { type: 'json' };
import WIDBox from './dataset/WIDBox.json' assert { type: 'json' };

initMockedAxios();
chai.use(spies);

const observation: Observation = {
  fromChain: 'ADA',
  toChain: 'ERG',
  fromAddress: '9i1Jy713XfahaB8oFFm2T9kpM7mzT1F4dMvMZKo7rJPB3U4vNVq',
  toAddress: '9hPZKvu48kKkPAwrhDukwVxmNrTAa1vXdSsbDijXVsEEYaUt3x5',
  amount: '100000',
  bridgeFee: '2520',
  networkFee: '10000000',
  sourceChainTokenId:
    'a5d0d1dd7c9faad78a662b065bf053d7e9b454af446fbd50c3bb2e3ba566e164',
  targetChainTokenId:
    '1db2acc8c356680e21d4d06ce345b83bdf61a89e6b0475768557e06aeb24709f',
  sourceTxId:
    'cb459f7f8189d3524e6b7361b55baa40c34a71ec5ac506628736096c7aa66f1a',
  sourceBlockId:
    '7e3b6c9cf8146cf49c0b255d9a8fbeeeb76bea64345f74edc25f8dfee0473968',
  requestId: 'reqId1',
  height: 1212,
};
const WID = '245341e0dda895feca93adbd2db9e643a74c50a1b3702db4c2535f23f1c72e6e';
const tokenId =
  '0088eb2b6745ad637112b50a4c5e389881f910ebcf802b183d6633083c2b04fc';
const userAddress = '9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT';
const userSecret = wasm.SecretKey.dlog_from_bytes(
  Buffer.from(
    '7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2',
    'hex'
  )
);

import repoObj from './dataset/repoBox.json' assert { type: 'json' };
import { getConfig } from '../../src/config/config';
import { Transaction } from '../../src/api/Transaction';
import sinon from 'sinon';
import { describe } from 'mocha';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import { initWatcherDB } from '../../src/init';
import { tokenRecord, validBox1Token } from '../database/mockedData';
import { TokenInfo } from '../../src/ergo/interfaces';

const repoBox = JSON.stringify(repoObj);

describe('Testing ergoUtils', () => {
  describe('commitmentFromObservation', () => {
    /**
     * Target: testing commitmentFromObservation
     * Expected Output:
     *    The function should return the commitment from the input observation
     */
    it('should return the correct commitment', () => {
      const res = ErgoUtils.commitmentFromObservation(observation, WID);
      expect(uint8ArrayToHex(res)).to.eql(
        '32d5595a12048a13a7807505b26b11e4eae4c69a0c87c39ff7555600708bd23a'
      );
    });
  });

  describe('createChangeBox', () => {
    const boxes = wasm.ErgoBoxes.from_boxes_json(boxesJson);
    const totalValue = extractBoxes(boxes)
      .map((box) => box.value().as_i64().as_num())
      .reduce((a, b) => a + b, 0);
    const secret = getConfig().general.secretKey;
    const txFee = parseInt(getConfig().general.fee);
    const contract = wasm.Contract.pay_to_address(secret.get_address());

    /**
     * Target: testing createChangeBox
     * Expected Output:
     *    The function should return the change box with the respect to input and outputs
     *    It should return nothing since all inputs are spent in outputs
     */
    it('should not return change box all assets are spent', () => {
      const builder = new wasm.ErgoBoxCandidateBuilder(
        wasm.BoxValue.from_i64(wasm.I64.from_str(totalValue.toString())),
        contract,
        10
      );
      builder.add_token(
        wasm.TokenId.from_str(tokenId),
        wasm.TokenAmount.from_i64(wasm.I64.from_str('100'))
      );
      const res = ErgoUtils.createChangeBox(
        boxes,
        [builder.build()],
        10,
        secret
      );
      expect(res).to.null;
    });

    /**
     * Target: testing createChangeBox
     * Expected Output:
     *    The function should return the change box with the respect to input and outputs
     *    It should throw a box creation error, since input tokens is more than output tokens
     *      and there is no erg amount left to create a change box for remaining tokens;
     *      thus, tokens are burning in the transaction
     */
    it('should throw error because tokens are burning', () => {
      const outputs = [
        new wasm.ErgoBoxCandidateBuilder(
          wasm.BoxValue.from_i64(wasm.I64.from_str(totalValue.toString())),
          contract,
          10
        ).build(),
      ];
      expect(function () {
        ErgoUtils.createChangeBox(boxes, outputs, 10, secret);
      }).to.throw(ChangeBoxCreationError);
    });

    /**
     * Target: testing createChangeBox
     * Expected Output:
     *    The function should return the change box with the respect to input and outputs
     *    It should throw box creation error, since output tokens are more than inputs
     */
    it('should throw error because output tokens are more', () => {
      const builder = new wasm.ErgoBoxCandidateBuilder(
        wasm.BoxValue.from_i64(wasm.I64.from_str(txFee.toString())),
        wasm.Contract.pay_to_address(secret.get_address()),
        10
      );
      builder.add_token(
        wasm.TokenId.from_str(tokenId),
        wasm.TokenAmount.from_i64(wasm.I64.from_str('101'))
      );
      expect(function () {
        ErgoUtils.createChangeBox(boxes, [builder.build()], 10, secret);
      }).to.throw(ChangeBoxCreationError);
    });

    /**
     * Target: testing createChangeBox
     * Expected Output:
     *    The function should return the change box with the respect to input and outputs
     *    It should return a change box containing all tokens, since output boxes doesn't have tokens
     */
    it('should return change box with all tokens', () => {
      const res = ErgoUtils.createChangeBox(boxes, [], 10, secret);
      expect(res).to.not.null;
      expect(res?.value().as_i64().as_num()).to.eql(totalValue - txFee);
      expect(res?.tokens().get(0).amount().as_i64().as_num()).to.eql(100);
    });

    /**
     * Target: testing createChangeBox
     * Expected Output:
     *    The function should return the change box with the respect to input and outputs
     *   It should return a change box containing all tokens, since output boxes have some tokens but not all
     */
    it('should return change box with some token', () => {
      const builder = new wasm.ErgoBoxCandidateBuilder(
        wasm.BoxValue.from_i64(wasm.I64.from_str(txFee.toString())),
        wasm.Contract.pay_to_address(secret.get_address()),
        10
      );
      builder.add_token(
        wasm.TokenId.from_str(tokenId),
        wasm.TokenAmount.from_i64(wasm.I64.from_str('10'))
      );
      const res = ErgoUtils.createChangeBox(
        boxes,
        [builder.build()],
        10,
        secret
      );
      expect(res).to.not.null;
      expect(res?.value().as_i64().as_num()).to.eql(totalValue - 2 * txFee);
      expect(res?.tokens().get(0).amount().as_i64().as_num()).to.eql(90);
    });

    /**
     * Target:
     * It should put wid token (if any) as the first token of the change box
     *
     * Dependencies:
     * - `Transaction.watcherWID`
     *
     * Scenario:
     * N/A
     *
     * Expected output:
     * The first token of generated change box should be wid (if present)
     */
    it('should put wid token (if any) as the first token of the change box', () => {
      const wid = WIDBox.assets[0].tokenId;
      sinon.stub(Transaction, 'watcherWID').value(wid);

      const res = ErgoUtils.createChangeBox(
        /**
         * `permitBox` is used here just to fill the first index and can be
         * replaced with any other box
         */
        wasm.ErgoBoxes.from_boxes_json([permitBox, WIDBox]),
        [],
        10,
        secret
      );

      const expected = wid;
      const actual = res?.tokens().get(0).id().to_str();
      expect(actual).to.eql(expected);
    });

    /**
     * @target ErgoUtils.createChangeBox should create a change box with correct amount of tokens
     * @dependencies
     * @scenario
     * - mock tokenBox to have a token with a large amount (bigger than number.MAX_SAFE)
     * - run test
     * - check output has the same number of tokens
     * @expected
     * - it should assume value and token amounts as BigInt type
     */
    it('should create the change box with correct amount of tokens', () => {
      const tokenAmount = '987654321987654321';
      const boxTokens: wasm.Tokens = new wasm.Tokens();
      boxTokens.add(
        new wasm.Token(
          wasm.TokenId.from_str(tokenId),
          wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount))
        )
      );

      const tokenBox = new wasm.ErgoBox(
        wasm.BoxValue.from_i64(wasm.I64.from_str('100000000')),
        10000,
        wasm.Contract.pay_to_address(wasm.Address.from_base58(userAddress)),
        wasm.TxId.from_str(observation.sourceTxId),
        0,
        boxTokens
      );
      const res = ErgoUtils.createChangeBox(
        new wasm.ErgoBoxes(tokenBox),
        [],
        10,
        secret
      );

      const outToken = res?.tokens().get(0).amount().as_i64().to_str();
      expect(outToken).to.eql(tokenAmount);
    });
  });

  describe('buildTxAndSign', () => {
    /**
     * Target: testing buildTxAndSign
     * Test Procedure:
     *    1- Mocking ErgoNetwork Api
     *    2- calling function
     *    3- validate output
     * Expected Output:
     *    The function should create and sign an arbitrary transaction
     */
    it('should sign an arbitrary transaction', async () => {
      initMockedAxios(0);
      const outValue =
        BigInt(getConfig().general.minBoxValue) +
        BigInt(getConfig().general.fee);
      const add = Address.from_base58(userAddress);
      const transactionInput = await ErgoNetwork.getErgBox(add, outValue);
      const inputBoxes = new wasm.ErgoBoxes(transactionInput[0]);
      if (transactionInput.length > 1) {
        for (let i = 0; i < transactionInput.length; i++) {
          inputBoxes.add(transactionInput[1]);
        }
      }

      const height = await ErgoNetwork.getHeight();

      const outBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
        wasm.BoxValue.from_i64(
          wasm.I64.from_str(getConfig().general.minBoxValue.toString())
        ),
        wasm.Contract.pay_to_address(add),
        height
      );

      const outBox = outBoxBuilder.build();
      const txOutBox = new wasm.ErgoBoxCandidates(outBox);

      const boxSelector = new wasm.SimpleBoxSelector();
      const targetBalance = wasm.BoxValue.from_i64(
        wasm.I64.from_str(outValue.toString())
      );
      const boxSelection = boxSelector.select(
        inputBoxes,
        targetBalance,
        new wasm.Tokens()
      );
      const builder = wasm.TxBuilder.new(
        boxSelection,
        txOutBox,
        height,
        wasm.BoxValue.from_i64(
          wasm.I64.from_str(getConfig().general.fee.toString())
        ),
        add
      );

      const tx_data_inputs = wasm.ErgoBoxes.from_boxes_json([]);
      const signedTx = await ErgoUtils.buildTxAndSign(
        builder,
        userSecret,
        inputBoxes,
        tx_data_inputs
      );
      expect(signedTx.id().to_str()).not.to.be.null;
    });
  });

  describe('contractHash', () => {
    /**
     * Target: testing contractHash
     * Expected Output:
     *    The function should return the blake2b digest of the input contract
     */
    it('tests the contract hash creation', () => {
      const fraudAddress =
        'LFz5FPkW7nPVq2NA5YcZAdSTVwt2BDL1ixGkVvoU7mNY3B8PoX6ix4YiqUe9WMRPQNdPZD7BJESqWiXwvjHh2Fik3XxFz6JYJLCS5WKrgzzZeXDctKRHYydwLbxpqXjqQda7s7M6FzuZ4uCdKudW19Ku8caVcZY6kQfqb8PUiRMpRQPuqfYtcr9S2feShR3BicKV9m2upFVmjd7bzsV6sXZXdaSAuCYCCoNbSoasJ9Xxtg1NVE94d';
      const data = ErgoUtils.contractHash(
        wasm.Contract.pay_to_address(wasm.Address.from_base58(fraudAddress))
      );
      expect(data.toString('base64')).to.eql(
        'ZKVYGZQSUzUZtgTQ6rtiZDba9hT6mOuvpBHNXw7Z7ZY='
      );
    });
  });

  describe('requiredCommitmentCount', () => {
    /**
     * Target: testing requiredCommitmentCount
     * Expected Output:
     *    The function should return the required commitments for trigger creation
     *    max commitments = 100
     *    percentage = 51
     *    watchers = 7
     *    min commitment = 0
     *    => result = 4
     */
    it('should return formula number as the required commitment count', async () => {
      const box = wasm.ErgoBox.from_json(repoBox);
      const data = ErgoUtils.requiredCommitmentCount(box);
      expect(data).to.eql(BigInt(4));
    });
  });

  describe('getBoxValuesSum', () => {
    /**
     * Target: testing getBoxValuesSum
     * Test Procedure: -
     * Expected Output:
     *    Should return zero without any input boxes
     */
    it('Should return zero without any input boxes', async () => {
      const data = ErgoUtils.getBoxValuesSum([]);
      expect(data).to.eql(0n);
    });

    /**
     * Target: testing getBoxValuesSum
     * Test Procedure:
     *    Creating mocked input boxes
     * Expected Output:
     *    Should return sum of all input boxes values
     */
    it('Should return sum of all input boxes values', async () => {
      const boxes = wasm.ErgoBoxes.from_boxes_json(boxesJson);
      const data = ErgoUtils.getBoxValuesSum(extractBoxes(boxes));
      expect(data).to.eql(67501049680n);
    });
  });

  describe('getWatcherTokens', () => {
    before('inserting into database', async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM);
      initWatcherDB(ORM.DB);
    });

    /**
     * @target ErgoUtils.getWatcherTokens should extract tokens in UTXOs
     * @dependencies
     * @scenario
     * - run the function
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to validBox1Token
     */
    it('should extract tokens in UTXOs', async () => {
      // run the function
      const result = await ErgoUtils.getWatcherTokens();

      // check the result
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.eql(validBox1Token);
    });
  });

  describe('placeTokenNames', async () => {
    before('inserting into database', async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM);
      initWatcherDB(ORM.DB);
    });

    /**
     * @target ErgoUtils.placeTokenNames should place token names from db
     * @dependencies
     * @scenario
     * - mock a tokenInfo array
     * - run the function
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to validBox1Token
     */
    it('should place token names from db', async () => {
      // mock a tokenInfo array
      const tokenInfo: TokenInfo[] = [
        {
          tokenId: tokenRecord.tokenId,
          amount: 1n,
        },
      ];

      // run the function
      const res = await ErgoUtils.placeTokenNames(tokenInfo);

      // check the result
      expect(res).to.have.lengthOf(1);
      expect(res[0].name).to.eql(tokenRecord.tokenName);
    });

    /**
     * @target ErgoUtils.placeTokenNames should place token names from network
     * @dependencies
     * @scenario
     * - mock a tokenInfo array
     * - run the function
     * - check the result
     * @expected
     * - should return data with length 1
     * - data[0] should be equal to name
     */
    it('should place token names from network', async () => {
      // mock a tokenInfo array
      const tokenInfo: TokenInfo[] = [
        {
          tokenId: 'token',
          amount: 1n,
        },
      ];

      // run the function
      const res = await ErgoUtils.placeTokenNames(tokenInfo);

      // check the result
      expect(res).to.have.lengthOf(1);
      expect(res[0].name).to.eql('name');
    });
  });
});
