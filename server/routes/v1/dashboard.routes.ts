import { Router } from 'express';
import { DashboardController } from '../../controllers/dashboard.controller';

const router = Router();

// GET /api/v1/dashboard/stats
router.get('/stats', DashboardController.getStats);

// GET /api/v1/dashboard/queue
router.get('/queue', DashboardController.getQueue);

// GET /api/v1/dashboard/activity
router.get('/activity', DashboardController.getActivity);

// GET /api/v1/dashboard/files
router.get('/files', DashboardController.getFiles);

// GET /api/v1/dashboard/logs
router.get('/logs', DashboardController.getLogs);

// GET /api/v1/dashboard/calendar
router.get('/calendar', DashboardController.getCalendarJobs);

export default router;
