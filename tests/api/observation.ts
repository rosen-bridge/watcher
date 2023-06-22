import chai, { expect } from 'chai';
import spies from 'chai-spies';
import express, { Router } from 'express';
import observationRouter from '../../src/api/observation';
import { initWatcherDB } from '../../src/init';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import request from 'supertest';
import { observation1, observation2 } from '../database/mockedData';

chai.use(spies);

const app = express();
app.use(express.json());

const router = Router();
router.use('/observation', observationRouter);
app.use(router);

describe('observationRouter', () => {
  describe('GET /observation', () => {
    before(async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM, false, true, true);
      initWatcherDB(ORM.DB);
    });

    /**
     * @target Observations endpoint should return
     * all observations
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of observations
     */
    it('Observations endpoint should return all observations', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/observation');

      // check the result
      expect(res.status).to.equal(200);
      const parsedResult = JSON.parse(res.text);
      expect(parsedResult).to.deep.equal([observation2, observation1]);
    });

    /**
     * @target Observations endpoint should return correct
     * observations with fromAddress filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of observations
     */
    it('Observations endpoint should return correct observations with fromAddress filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        '/observation?fromAddress=fromAddress'
      );

      // check the result
      expect(res.status).to.equal(200);
      const parsedResult = JSON.parse(res.text);
      expect(parsedResult).to.deep.equal([observation1]);
    });

    /**
     * @target Observations endpoint should return correct
     * observations with toAddress filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of observations
     */
    it('Observations endpoint should return correct observations with toAddress filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/observation?toAddress=addr4');

      // check the result
      expect(res.status).to.equal(200);
      const parsedResult = JSON.parse(res.text);
      expect(parsedResult).to.deep.equal([observation2]);
    });

    /**
     * @target Observations endpoint should return correct
     * observations with minHeight filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of observations
     */
    it('Observations endpoint should return correct observations with minHeight filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/observation?minHeight=7');

      // check the result
      expect(res.status).to.equal(200);
      const parsedResult = JSON.parse(res.text);
      expect(parsedResult).to.deep.equal([observation2]);
    });

    /**
     * @target Observations endpoint should return correct
     * observations with maxHeight filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of observations
     */
    it('Observations endpoint should return correct observations with maxHeight filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/observation?maxHeight=7');

      // check the result
      expect(res.status).to.equal(200);
      const parsedResult = JSON.parse(res.text);
      expect(parsedResult).to.deep.equal([observation1]);
    });

    /**
     * @target Observations endpoint should return correct
     * observations with sourceTokenId filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of observations
     */
    it('Observations endpoint should return correct observations with sourceTokenId filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        '/observation?sourceTokenId=sourceToken'
      );

      // check the result
      expect(res.status).to.equal(200);
      const parsedResult = JSON.parse(res.text);
      expect(parsedResult).to.deep.equal([observation1]);
    });

    /**
     * @target Observations endpoint should return correct
     * observations with sourceTxId filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of observations
     */
    it('Observations endpoint should return correct observations with sourceTxId filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/observation?sourceTxId=txId4');

      // check the result
      expect(res.status).to.equal(200);
      const parsedResult = JSON.parse(res.text);
      expect(parsedResult).to.deep.equal([observation2]);
    });

    /**
     * @target Observations endpoint should return correct
     * observations when setting offset/limit
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of observations
     */
    it('Observations endpoint should return correct observations when setting offset/limit', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/observation?limit=1&offset=1');

      // check the result
      expect(res.status).to.equal(200);
      const parsedResult = JSON.parse(res.text);
      expect(parsedResult).to.deep.equal([observation1]);
    });
  });
});