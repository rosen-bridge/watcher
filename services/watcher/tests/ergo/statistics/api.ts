import { fillORM, loadDataBase } from '../../database/watcherDatabase';
import Statistics from '../../../src/statistics/statistics';
import express, { Router } from 'express';
import { statisticsRouter } from '../../../src/statistics/apis';
import request from 'supertest';
import chai, { expect } from 'chai';
import spies from 'chai-spies';

chai.use(spies);

const ORM = await loadDataBase();
await fillORM(ORM);
const app = express();
app.use(express.json());

const router = Router();
router.use('/statistics', statisticsRouter);
app.use(router);

describe('Statistics-Api', () => {
  before('Mocking Statistics Class functions', async () => {
    const DB = ORM.DB;
    Statistics.setup(DB, 'WIDStatistics');
    Statistics.getInstance();
    chai.spy.on(Statistics, 'getCommitments', (offset, limit) => {
      if (offset === 0 && limit === 1) {
        return [
          {
            eventId: 'eventId1',
            boxId: 'boxIdStatistics1',
            block: 'block',
            height: 1005,
            spendBlock: null,
            spendHeight: null,
          },
        ];
      }
      if (offset === 1 && limit === 2) {
        return [
          {
            eventId: 'eventId2',
            boxId: 'boxIdStatistics2',
            block: 'block',
            height: 1005,
            spendBlock: null,
            spendHeight: null,
          },
          {
            eventId: 'eventId3',
            boxId: 'boxIdStatistics3',
            block: 'block',
            height: 1005,
            spendBlock: null,
            spendHeight: null,
          },
        ];
      }
    });
    chai.spy.on(Statistics, 'getEventTriggers', (offset, limit) => {
      if (offset === 0 && limit === 1) {
        return [
          {
            boxId: 'boxIdStatistics',
            block: 'blockID',
            height: 100,
            fromChain: 'fromChain',
            toChain: 'toChain',
            fromAddress: 'fromAddress',
            toAddress: 'toAddress',
            amount: '100',
            bridgeFee: '200',
            networkFee: '1000',
            sourceChainTokenId: 'tokenId',
            targetChainTokenId: 'targetTokenId',
            sourceTxId: 'txId',
            sourceBlockId: 'block',
            spendBlock: null,
            spendHeight: null,
          },
        ];
      }
      if (offset === 1 && limit === 2) {
        return [
          {
            boxId: 'boxIdStatistics2',
            block: 'blockID',
            height: 100,
            fromChain: 'fromChain',
            toChain: 'toChain',
            fromAddress: 'fromAddress',
            toAddress: 'toAddress',
            amount: '100',
            bridgeFee: '200',
            networkFee: '1000',
            sourceChainTokenId: 'tokenId',
            targetChainTokenId: 'targetTokenId',
            sourceTxId: 'txId',
            sourceBlockId: 'block',
            spendBlock: null,
            spendHeight: null,
          },
          {
            boxId: 'boxIdStatistics3',
            block: 'blockID',
            height: 100,
            fromChain: 'fromChain',
            toChain: 'toChain',
            fromAddress: 'fromAddress',
            toAddress: 'toAddress',
            amount: '100',
            bridgeFee: '200',
            networkFee: '1000',
            sourceChainTokenId: 'tokenId',
            targetChainTokenId: 'targetTokenId',
            sourceTxId: 'txId',
            sourceBlockId: 'block',
            spendBlock: null,
            spendHeight: null,
          },
        ];
      }
    });
    chai.spy.on(Statistics, 'getErgsAndFee', () => {
      return {
        ergs: 98900000n,
        tokens: {
          '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267':
            11n,
          '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95':
            10n,
        },
      };
    });
    chai.spy.on(Statistics, 'getCommitmentsCount', () => 3);
    chai.spy.on(Statistics, 'getEventTriggersCount', () => 3);
  });

  describe('GET /statistics', () => {
    /**
     * Target: testing GET /statistics endpoint
     * Dependencies:
     *    Statistics
     * Test Procedure:
     *    1- calling endpoint
     *    2- validate endpoint with mocked inputs
     * Expected Output:
     *  then endpoint should be in expected schema
     */
    it("Checks that 'statistics' endpoint is in expected schema", async () => {
      const res = await request(app).get('/statistics');
      expect(res.status).equal(200);
      expect(res.body).to.eql({
        ergs: '98900000',
        commitmentsCount: 3,
        eventTriggersCount: 3,
        fee: {
          '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267':
            '11',
          '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95':
            '10',
        },
      });
    });
  });

  describe('GET /commitments', () => {
    /**
     * Target: testing GET /commitments endpoint
     * Dependencies:
     *    Statistics
     * Test Procedure:
     *    1- calling endpoint
     *    2- validate endpoint with mocked inputs
     * Expected Output:
     *  then endpoint should be in expected schema
     */
    it("Checks that 'commitments' endpoint is in expected schema with offset=0 & limit=1", async () => {
      const res = await request(app)
        .get('/statistics/commitments')
        .query({ offset: '0', limit: '1' });
      expect(res.status).to.equal(200);
      expect(res.body).to.eql([
        {
          eventId: 'eventId1',
          boxId: 'boxIdStatistics1',
          block: 'block',
          height: 1005,
          spendBlock: null,
          spendHeight: null,
        },
      ]);
    });

    /**
     * Target: testing GET /commitments endpoint
     * Dependencies:
     *    Statistics
     * Test Procedure:
     *    1- calling endpoint
     *    2- validate endpoint with mocked inputs
     * Expected Output:
     *  then endpoint should be in expected schema
     */
    it("Checks that 'commitments' endpoint is in expected schema with offset=1 & limit=2", async () => {
      const res = await request(app)
        .get('/statistics/commitments')
        .query({ offset: '1', limit: '2' });
      expect(res.status).to.equal(200);
      expect(res.body).to.eql([
        {
          eventId: 'eventId2',
          boxId: 'boxIdStatistics2',
          block: 'block',
          height: 1005,
          spendBlock: null,
          spendHeight: null,
        },
        {
          eventId: 'eventId3',
          boxId: 'boxIdStatistics3',
          block: 'block',
          height: 1005,
          spendBlock: null,
          spendHeight: null,
        },
      ]);
    });
  });

  describe('GET /eventTriggers', () => {
    /**
     * Target: testing GET /eventTriggers endpoint
     * Dependencies:
     *    Statistics
     * Test Procedure:
     *    1- calling endpoint
     *    2- validate endpoint with mocked inputs
     * Expected Output:
     *  then endpoint should be in expected schema
     */
    it("Checks that 'eventTriggers' endpoint is in expected schema with offset=0 & limit=1", async () => {
      const res = await request(app)
        .get('/statistics/eventTriggers')
        .query({ offset: '0', limit: '1' });
      expect(res.status).to.equal(200);
      expect(res.body).to.eql([
        {
          boxId: 'boxIdStatistics',
          block: 'blockID',
          height: 100,
          fromChain: 'fromChainStar',
          toChain: 'toChainStar',
          fromAddress: 'fromAddress',
          toAddress: 'toAddress',
          amount: '100',
          bridgeFee: '200',
          networkFee: '1000',
          sourceChainTokenId: 'tokenIdStar',
          targetChainTokenId: 'targetTokenId',
          sourceTxId: 'txIdStar',
          sourceBlockId: 'block',
          spendBlock: null,
          spendHeight: null,
        },
      ]);
    });

    /**
     * Target: testing GET /eventTriggers endpoint
     * Dependencies:
     *    Statistics
     * Test Procedure:
     *    1- calling endpoint
     *    2- validate endpoint with mocked inputs
     * Expected Output:
     *  then endpoint should be in expected schema
     */
    it("Checks that 'eventTriggers' endpoint is in expected schema with offset=1 & limit=2", async () => {
      const res = await request(app)
        .get('/statistics/eventTriggers')
        .query({ offset: '1', limit: '2' });
      expect(res.status).to.equal(200);
      expect(res.body).to.eql([
        {
          boxId: 'boxIdStatistics2',
          block: 'blockID',
          height: 100,
          fromChain: 'fromChainStar',
          toChain: 'toChainStar',
          fromAddress: 'fromAddress',
          toAddress: 'toAddress',
          amount: '100',
          bridgeFee: '200',
          networkFee: '1000',
          sourceChainTokenId: 'tokenIdStar',
          targetChainTokenId: 'targetTokenId',
          sourceTxId: 'txIdStar',
          sourceBlockId: 'block',
          spendBlock: null,
          spendHeight: null,
        },
        {
          boxId: 'boxIdStatistics3',
          block: 'blockID',
          height: 100,
          fromChain: 'fromChainStar',
          toChain: 'toChainStar',
          fromAddress: 'fromAddress',
          toAddress: 'toAddress',
          amount: '100',
          bridgeFee: '200',
          networkFee: '1000',
          sourceChainTokenId: 'tokenIdStar',
          targetChainTokenId: 'targetTokenId',
          sourceTxId: 'txIdStar',
          sourceBlockId: 'block',
          spendBlock: null,
          spendHeight: null,
        },
      ]);
    });
  });
});
