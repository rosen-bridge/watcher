import { Response } from 'express';
import { ApiError } from './apiError';
import { ApiValidationError } from './apiValidationError';

/**
 * Send error content by related status code
 * @param res
 * @param e
 */
export const sendApiError = (
  res: Response,
  e: Error | ApiError | ApiValidationError
) => {
  let error: ApiError | ApiValidationError;
  if (!(e instanceof ApiError)) {
    error = new ApiError(e.message);
  } else {
    error = e;
  }
  res.status(error.statusCode).json(error.toResponse());
};
