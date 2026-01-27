import express, { Request, Response } from 'express';
import request from 'supertest';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { HttpStatus } from '../../../src/constants';
import { errorHandler } from '../../../src/middlewares/errorHandler';
import { ApiError } from '../../../src/errors/apiErrors';

const app = express();

app.get('/test-error', (req: Request, res: Response) => {
  throw new ApiError();
});

app.use(errorHandler);

describe('ApiError', () => {
  describe('toResponse', () => {
    /**
     * @target should return the expected JSON for ApiError
     * @scenario Throw an ApiError in route
     * @expected JSON response matches ApiErrorFormatInterface with correct message
     */
    it('should return the expected JSON for ApiError', async () => {
      const res = await request(app).get('/test-error');

      expect(res.status).to.equal(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.body).to.deep.equal({
        message: 'internal server error',
      });
    });
  });
});
