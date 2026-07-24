import { Router } from 'express';
import { GoogleDriveController } from '../../controllers/drive.controller';

const router = Router();

// GET /api/v1/google-drive/files
router.get('/files', GoogleDriveController.listFiles);

// GET /api/v1/google-drive/status
router.get('/status', GoogleDriveController.getSyncStatus);

// POST /api/v1/google-drive/sync  (fire-and-forget)
router.post('/sync', GoogleDriveController.triggerSync);

// POST /api/v1/google-drive/sync/wait  (await result)
router.post('/sync/wait', GoogleDriveController.triggerSyncAndWait);

export default router;
