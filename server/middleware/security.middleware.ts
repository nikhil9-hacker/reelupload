import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Logger } from '../utils/logger.util';

/**
 * Helmet middleware for security headers.
 */
export const helmetSecurity = helmet({
  contentSecurityPolicy: false, // Disabled for Vite hot reload & iframe embedded views
  crossOriginEmbedderPolicy: false,
});

/**
 * Custom secure headers middleware ensuring essential security headers.
 */
export function secureHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

/**
 * Rate Limiter Placeholder middleware for future rate limiting implementation.
 */
export function rateLimiterPlaceholderMiddleware(req: Request, res: Response, next: NextFunction): void {
  Logger.debug(`[RateLimiter Placeholder] Evaluated request for IP: ${req.ip}`);
  next();
}
