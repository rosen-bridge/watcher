import chai, { expect } from 'chai';
import spies from 'chai-spies';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import express, { Router } from 'express';
import { default as addressRouter } from '../../src/api/address';
import request from 'supertest';
import { initWatcherDB } from '../../src/init';
import JSONBigInt from 'json-bigint';
import { validBox0Token, validBox1Token } from '../database/mockedData';

chai.use(spies);

const app = express();
app.use(express.json());

const router = Router();
router.use('/address', addressRouter);
app.use(router);

describe('addressRouter', () => {
  describe('GET /assets', () => {
    before(async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM);
      initWatcherDB(ORM.DB);
    });

    /**
     * @target Assets endpoint should return all tokens
     * with default sorting
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of tokens
     */
    it('Assets endpoint should return all tokens with default sorting', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/address/assets');

      // check the result
      expect(res.status).to.equal(200);
      expect(res.text).to.equal(
        JSONBigInt.stringify([validBox1Token, validBox0Token])
      );
    });

    it('Assets endpoint should return sorted tokens properly', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/address/assets?sortByAmount=desc');

      // check the result
      expect(res.status).to.equal(200);
      expect(res.text).to.equal(
        JSONBigInt.stringify([validBox0Token, validBox1Token])
      );
    });

    it('Assets endpoint should return correct token when filtered by tokenId', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        `/address/assets?tokenId=${validBox0Token.tokenId}`
      );

      // check the result
      expect(res.status).to.equal(200);
      expect(res.text).to.equal(JSONBigInt.stringify([validBox0Token]));
    });

    it('Assets endpoint should return correct token when filtered by tokenName', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        '/address/assets?tokenId=wrongTokenId'
      );

      // check the result
      expect(res.status).to.equal(200);
      expect(res.text).to.equal('[]');
    });

    it('Assets endpoint should return the second page when setting offset/limit', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/address/assets?offset=1&limit=1');

      // check the result
      expect(res.status).to.equal(200);
      expect(res.text).to.equal(JSONBigInt.stringify([validBox0Token]));
    });
  });
});
