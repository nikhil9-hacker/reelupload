import { Router } from 'express';
import v1Router from './v1';
import { AuthController } from '../controllers/auth.controller';
import { notFoundHandler } from '../middleware/error.middleware';

const apiRouter = Router();

// Mount V1 API
apiRouter.use('/v1', v1Router);

// Fallback legacy health endpoint mapping to V1 health
apiRouter.use('/health', v1Router);

// Direct route aliases for OAuth & callback compatibility
apiRouter.get('/instagram/auth-url', AuthController.getInstagramAuthUrl);

// Catch-all 404 handler for unknown /api/* endpoints
apiRouter.use('*', notFoundHandler);

export default apiRouter;
