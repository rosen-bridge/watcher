import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import request from 'supertest';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ApiValidationError } from '../../../src/errors/apiErrors';
import { HttpStatus } from '../../../src/constants';
import { errorHandler } from '../../../src/middlewares/errorHandler';

const app = express();
app.use(express.json());

app.post(
  '/test-validation',
  body('email')
    .notEmpty()
    .withMessage('email is required')
    .isEmail()
    .withMessage('invalid email'),
  body('password').isLength({ min: 6 }).withMessage('password too short'),
  (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new ApiValidationError(errors);
    }

    res.status(HttpStatus.OK).json({ success: true });
  }
);

app.use(errorHandler);

describe('ApiValidationError', () => {
  describe('toResponse', () => {
    /**
     * @target should return validation error details for empty request body
     * @scenario Submit empty body to trigger multiple validation errors
     * @expected JSON response contains message "bad request," and field-level errors for email and password
     */
    it('should return validation error details for empty request body', async () => {
      const res = await request(app).post('/test-validation').send({});

      expect(res.status).to.equal(HttpStatus.BAD_REQUEST);
      expect(res.body).to.have.property(
        'message',
        'bad request, email: email is required, email: invalid email, password: password too short'
      );
    });

    /**
     * @target should return validation error details for invalid email and short password
     * @scenario Submit partially valid body (email invalid, password too short)
     * @expected JSON response contains message "bad request," and correct field-level errors
     */
    it('should return validation error details for invalid email and short password', async () => {
      const res = await request(app)
        .post('/test-validation')
        .send({ email: 'not-an-email', password: '123' });

      expect(res.status).to.equal(HttpStatus.BAD_REQUEST);
      expect(res.body).to.have.property(
        'message',
        'bad request, email: invalid email, password: password too short'
      );
    });
  });
});
