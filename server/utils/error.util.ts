import { ApiError } from '../errors/api.error';

export { ApiError };

export class AppError extends ApiError {}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

export class NotImplementedError extends ApiError {
  constructor(message: string = 'Endpoint not implemented', errorCode: string = 'NOT_IMPLEMENTED') {
    super(message, 501, errorCode);
  }
}

export class BadRequestError extends ApiError {
  constructor(
    message: string = 'Bad request',
    details?: Record<string, unknown> | string[],
    errorCode: string = 'BAD_REQUEST'
  ) {
    super(message, 400, errorCode, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', errorCode: string = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', errorCode: string = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, errorCode);
  }
}
