import { Router } from 'express';
import { UploadController } from '../../controllers/upload.controller';

const router = Router();

router.use('*', UploadController.handleUploadRoute);

export default router;
