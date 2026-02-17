import { STATUS_CODES } from 'node:http';

import { HttpStatus } from '../../constants';

const defaultMessage =
  STATUS_CODES[HttpStatus.INTERNAL_SERVER_ERROR]?.toLowerCase() ??
  'internal server error';

export class ApiError extends Error {
  constructor(
    public message: string = defaultMessage,
    public statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(message);

    this.name = 'ApiError';
  }

  /**
   * create response content
   */
  toResponse = () => {
    return {
      message: this.message,
    };
  };
}
