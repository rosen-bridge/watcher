import chai, { expect } from 'chai';
import spies from 'chai-spies';
import express, { Router } from 'express';
import generalRouter from '../../src/api/general';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import { initWatcherDB } from '../../src/init';
import request from 'supertest';
import { generalInfo } from '../database/mockedData';
import { HealthCheckSingleton } from '../../src/utils/healthCheck';
import { Transaction } from '../../src/api/Transaction';
import sinon from 'sinon';

chai.use(spies);

const app = express();
app.use(express.json());

const router = Router();
router.use('/info', generalRouter);
app.use(router);

describe('General-Info-Api', () => {
  describe('GET /', () => {
    before('inserting into database', async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM);
      initWatcherDB(ORM.DB);
      const healthCheck = HealthCheckSingleton.getInstance();
      chai.spy.on(healthCheck, 'getOverallStatus', () =>
        Promise.resolve('Healthy')
      );
    });

    afterEach(() => {
      sinon.restore();
      chai.spy.restore();
    });

    /**
     * @target General info endpoint should return valid data
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be equal to generalInfo
     */
    it('General info endpoint should return valid data', async () => {
      // send a request to the endpoint
      chai.spy.on(Transaction, 'getInstance', () => ({
        getCollateral: () => Promise.resolve({ erg: 20n, rsn: 10n }),
        getTotalPermit: () => Promise.resolve(10000n),
        getRequiredPermitCountPerEvent: () => Promise.resolve(10000n),
      }));

      const res = await request(app).get('/info');

      // check the result
      expect(res.status).to.equal(200);
      expect(res.text).to.equal(JSON.stringify(generalInfo));
    });
  });
});
