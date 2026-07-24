import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.util';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    Logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
      method,
      url: originalUrl,
      statusCode,
      durationMs: duration,
      ip,
    });
  });

  next();
}
