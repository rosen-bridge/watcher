import chai, { expect } from 'chai';
import spies from 'chai-spies';
import express, { Router } from 'express';
import revenueRouter from '../../src/api/revenue';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import { initWatcherDB } from '../../src/init';
import request from 'supertest';
import * as console from 'console';
import {
  firstRevenue,
  lastRevenue,
  secondTokenId2Revenue,
  tokenId2Revenue,
} from '../ergo/statistics/mockUtils';

chai.use(spies);

const app = express();
app.use(express.json());

const router = Router();
router.use('/revenue', revenueRouter);
app.use(router);

describe('revenueRouter', () => {
  describe('GET /revenue', () => {
    before(async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM);
      initWatcherDB(ORM.DB);
    });

    /**
     * @target Revenue endpoint should return
     * all revenues
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 10
     * - the first and last element of body must be correct
     */
    it('Revenue endpoint should return all revenues', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(10);
      expect(resultParsed[0]).to.eql(firstRevenue);
      expect(resultParsed[9]).to.eql(lastRevenue);
    });

    /**
     * @target Revenue endpoint should return
     * all revenues in reverse order
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 10
     * - the first and last element of body must be correct
     */
    it('Revenue endpoint should return all revenues in reverse order', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?sorting=asc');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(10);
      expect(resultParsed[9]).to.eql(firstRevenue);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues with fromChain filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of zero
     */
    it('Revenue endpoint should return correct revenues with fromChain filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?fromChain=fromChainStar');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(6);
      expect(resultParsed[5]).to.eql(lastRevenue);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues with toChain filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of zero
     */
    it('Revenue endpoint should return correct revenues with toChain filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?toChain=toChainStar');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(6);
      expect(resultParsed[5]).to.eql(lastRevenue);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues with tokenId filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should be valid array of revenues
     */
    it('Revenue endpoint should return correct revenues with tokenId filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?tokenId=tokenId2');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([tokenId2Revenue, secondTokenId2Revenue]);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues with sourceTxId filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of zero
     */
    it('Revenue endpoint should return correct revenues with sourceTxId filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?sourceTxId=txIdStar');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(6);
      expect(resultParsed[5]).to.eql(lastRevenue);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues with heightMin filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should be valid array of revenues
     */
    it('Revenue endpoint should return correct revenues with heightMin filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?heightMin=1112');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([firstRevenue]);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues with heightMax filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 4
     * - the last element of body must be correct
     */
    it('Revenue endpoint should return correct revenues with heightMax filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?heightMax=1112');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(4);
      expect(resultParsed[0]).to.eql(tokenId2Revenue);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues with fromBlockTime filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should be valid array of revenues
     */
    it('Revenue endpoint should return correct revenues with fromBlockTime filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?fromBlockTime=124');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([firstRevenue]);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues with toBlockTime filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 4
     * - the last element of body must be correct
     */
    it('Revenue endpoint should return correct revenues with toBlockTime filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?toBlockTime=124');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(4);
      expect(resultParsed[0]).to.eql(tokenId2Revenue);
    });

    /**
     * @target Revenue endpoint should return correct
     * revenues when setting offset/limit
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 1
     * - the only element of body must be correct
     */
    it('Revenue endpoint should return correct revenues when setting offset/limit', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?offset=1&limit=1');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(1);
      expect(resultParsed[0]).to.eql(tokenId2Revenue);
    });
  });
});
