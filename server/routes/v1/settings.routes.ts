import { Router } from 'express';
import { SettingsController } from '../../controllers/settings.controller';

const router = Router();

router.use('*', SettingsController.handleSettingsRoute);

export default router;
