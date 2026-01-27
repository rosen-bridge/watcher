import {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
  RequestHandler,
} from 'express';
import { ApiError } from '../errors/apiErrors';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { HttpStatus } from 'src/constants';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

/**
 * Global Express error handler middleware.
 *
 * @param err
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toResponse());
  }

  logger.error(`Internal server error: ${err}`);

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    message: 'internal server error',
    errors: {},
  });
};
