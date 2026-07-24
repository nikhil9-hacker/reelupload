import express, { Express } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { envConfig } from './config/env.config';
import { Logger } from './utils/logger.util';
import {
  helmetSecurity,
  secureHeadersMiddleware,
  rateLimiterPlaceholderMiddleware,
} from './middleware/security.middleware';
import { compressionMiddleware } from './middleware/compression.middleware';
import { requestLoggerMiddleware } from './middleware/logging.middleware';
import { sessionMiddleware } from './session/session.middleware';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware';
import { AuthController } from './controllers/auth.controller';
import { GoogleAuthController } from './controllers/google.controller';
import apiRouter from './routes';

export async function createApp(): Promise<Express> {
  const app = express();

  // Trust proxy configuration
  app.set('trust proxy', true);

  // Security middlewares
  app.use(helmetSecurity);
  app.use(secureHeadersMiddleware);

  // Performance & compression
  app.use(compressionMiddleware);

  // Request logging & body parsing
  app.use(requestLoggerMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session & rate limiting middlewares
  app.use(sessionMiddleware);
  app.use(rateLimiterPlaceholderMiddleware);

  // Direct top-level Meta & Google OAuth callback handlers
  app.get(['/auth/instagram/callback', '/auth/instagram/callback/'], AuthController.handleInstagramCallback);
  app.get(['/auth/google/callback', '/auth/google/callback/'], GoogleAuthController.handleGoogleCallback);

  // API Routes
  app.use('/api', apiRouter);

  // Vite development vs production static file serving
  if (!envConfig.isProduction) {
    Logger.info('[Server] Integrating Vite development server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    Logger.info('[Server] Configuring production static file serving...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/auth')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error Handling Middlewares
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
