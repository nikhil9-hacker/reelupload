import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/api.error';
import { NotFoundError } from '../utils/error.util';
import { ResponseUtil } from '../utils/response.util';
import { Logger } from '../utils/logger.util';
import { envConfig } from '../config/env.config';

/**
 * Handle 404 Not Found requests.
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
  next(error);
}

/**
 * Global Error Handling Middleware.
 */
export function globalErrorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An internal server error occurred.';
  let details: Record<string, unknown> | string[] | undefined = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;
  } else {
    Logger.error(`Unhandled Server Error: ${err.message}`, err, {
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Include stack trace in development only for unhandled errors
  if (!envConfig.isProduction && !(err instanceof ApiError)) {
    details = { stack: err.stack };
  }

  res.status(statusCode).json(ResponseUtil.error(message, errorCode, details));
}
