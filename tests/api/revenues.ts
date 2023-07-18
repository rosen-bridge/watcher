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
  revenueMonthlyChart,
  revenueWeeklyChart,
  revenueYearlyChart,
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
      expect(resultParsed.length).to.eql(4);
      expect(resultParsed[0]).to.eql(firstRevenue);
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
      console.log('####################');
      console.log(res.text);

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(4);
      expect(resultParsed[3]).to.eql(firstRevenue);
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
     * - response body should have length of 6
     * - the last element of body must be correct
     */
    it('Revenue endpoint should return correct revenues with fromChain filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?fromChain=fromChainStar');
      console.log('####################');
      console.log(res.text);
      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      const revenueIds = resultParsed.map((revenue: any) => revenue.id);
      expect(revenueIds).to.eql([3, 1]);
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
     * - response body should have length of 6
     * - the last element of body must be correct
     */
    it('Revenue endpoint should return correct revenues with toChain filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?toChain=toChainStar');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      const revenueIds = resultParsed.map((revenue: any) => revenue.id);
      expect(revenueIds).to.eql([3, 1]);
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
      const res = await request(app).get('/revenue?tokenId=tokenIdStar');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      const revenueIds = resultParsed.map((revenue: any) => revenue.id);
      expect(revenueIds).to.eql([3, 1]);
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
     * - response body should have length of 6
     * - the last element of body must be correct
     */
    it('Revenue endpoint should return correct revenues with sourceTxId filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue?sourceTxId=txIdStar');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(2);
      const revenueIds = resultParsed.map((revenue: any) => revenue.id);
      expect(revenueIds).to.eql([3, 1]);
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
      expect(resultParsed.length).to.eql(1);
      expect(resultParsed[0].id).to.eql(3);
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
      expect(resultParsed.length).to.eql(1);
      expect(resultParsed[0].id).to.eql(3);
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
      expect(resultParsed[0].id).to.eql(4);
    });
  });

  describe('GET /revenue/chart', () => {
    before(async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM);
      initWatcherDB(ORM.DB);
    });

    /**
     * @target RevenueChart endpoint should return correct
     * chart data with weekly period
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 1
     * - the only element of body must be correct
     */
    it('RevenueChart endpoint should return correct chart data with weekly period', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue/chart?period=week');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql(revenueWeeklyChart);
    });

    /**
     * @target RevenueChart endpoint should return correct
     * chart data with monthly period
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 1
     * - the only element of body must be correct
     */
    it('RevenueChart endpoint should return correct chart data with monthly period', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue/chart?period=month');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql(revenueMonthlyChart);
    });

    /**
     * @target RevenueChart endpoint should return correct
     * chart data with yearly period
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 1
     * - the only element of body must be correct
     */
    it('RevenueChart endpoint should return correct chart data with yearly period', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/revenue/chart?period=year');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql(revenueYearlyChart);
    });

    /**
     * @target RevenueChart endpoint should return correct
     * chart data when setting offset/limit
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - response status should be 200
     * - response body should have length of 1
     * - the only element of body must be correct
     */
    it('RevenueChart endpoint should return correct chart data when setting offset/limit', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        '/revenue/chart?period=year&offset=1&limit=1'
      );

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed.length).to.eql(1);
      expect(resultParsed[0]).to.eql(revenueYearlyChart[1]);
    });
  });
});
