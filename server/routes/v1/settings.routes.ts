import { Router } from 'express';
import { SettingsController } from '../../controllers/settings.controller';

const router = Router();

router.get('/', SettingsController.handleSettingsRoute);

export default router;
