import { Result, ValidationError } from 'express-validator';
import { ApiError } from './apiError';
import { STATUS_CODES } from 'node:http';
import { HttpStatus } from '../../constants';

const defaultMessage =
  STATUS_CODES[HttpStatus.BAD_REQUEST]?.toLowerCase() ?? 'bad request';

export class ApiValidationError extends ApiError {
  static readonly message: string = defaultMessage;

  constructor(public errors: Result<ValidationError>) {
    super(ApiValidationError.message, HttpStatus.BAD_REQUEST);

    this.name = 'ApiValidationError';
  }

  toResponse() {
    const errors: string[] = [this.message];
    for (const error of this.errors.array()) {
      for (const err of (error.nestedErrors ?? [error]) as ValidationError[]) {
        const field = err.param;
        errors.push(`${field}: ${err.msg}`);
      }
    }
    return {
      message: errors.join(', '),
    };
  }
}
