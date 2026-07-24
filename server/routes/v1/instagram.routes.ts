import { Router } from 'express';
import { InstagramController } from '../../controllers/instagram.controller';

const router = Router();

// GET /api/v1/instagram/status
router.get('/status', InstagramController.getStatus);

// GET /api/v1/instagram/reels
router.get('/reels', InstagramController.listReels);

// POST /api/v1/instagram/publish/:jobId
router.post('/publish/:jobId', InstagramController.manualPublish);

export default router;
