import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';

const router = Router();

// /api/v1/auth/instagram
router.get('/instagram', AuthController.getInstagramAuthUrl);

// /api/v1/auth/instagram/status
router.get('/instagram/status', AuthController.getInstagramStatus);

// /api/v1/auth/instagram/callback
router.get('/instagram/callback', AuthController.handleInstagramCallback);

// /api/v1/auth/instagram/disconnect
router.post('/instagram/disconnect', AuthController.disconnectInstagram);

// /api/v1/auth/onboarding/finish
router.post('/onboarding/finish', AuthController.finishOnboarding);

export default router;
