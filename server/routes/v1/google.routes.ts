import { Router } from 'express';
import { GoogleAuthController } from '../../controllers/google.controller';

const router = Router();

// /api/v1/google/auth
router.get('/auth', GoogleAuthController.getGoogleAuthUrl);

// /api/v1/google/callback
router.get('/callback', GoogleAuthController.handleGoogleCallback);

// /api/v1/google/status
router.get('/status', GoogleAuthController.getGoogleStatus);

// /api/v1/google/token
router.get('/token', GoogleAuthController.getGoogleToken);

// /api/v1/google/folder
router.post('/folder', GoogleAuthController.saveDriveFolder);

// /api/v1/google/disconnect
router.post('/disconnect', GoogleAuthController.disconnectGoogle);

export default router;
