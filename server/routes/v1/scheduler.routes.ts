import { Router } from 'express';
import { SchedulerController } from '../../controllers/scheduler.controller';

const router = Router();

// GET /api/v1/scheduler/stats
router.get('/stats', SchedulerController.getStats);

// GET /api/v1/scheduler/jobs
router.get('/jobs', SchedulerController.listJobs);

// POST /api/v1/scheduler/jobs
router.post('/jobs', SchedulerController.createJob);

// GET /api/v1/scheduler/jobs/:id
router.get('/jobs/:id', SchedulerController.getJob);

// DELETE /api/v1/scheduler/jobs/:id
router.delete('/jobs/:id', SchedulerController.cancelJob);

// POST /api/v1/scheduler/jobs/:id/pause
router.post('/jobs/:id/pause', SchedulerController.pauseJob);

// POST /api/v1/scheduler/jobs/:id/resume
router.post('/jobs/:id/resume', SchedulerController.resumeJob);

// POST /api/v1/scheduler/jobs/:id/retry
router.post('/jobs/:id/retry', SchedulerController.retryJob);

export default router;
