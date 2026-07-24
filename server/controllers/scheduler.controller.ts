import { Request, Response, NextFunction } from 'express';
import { SchedulerService } from '../services/scheduler.service';
import { ResponseUtil } from '../utils/response.util';
import { BadRequestError } from '../utils/error.util';
import { Logger } from '../utils/logger.util';

export class SchedulerController {
  /**
   * POST /api/v1/scheduler/jobs
   * Create a new scheduled publishing job.
   */
  public static async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const { driveFileId, scheduledAt, timezone, caption } = req.body;

      if (!driveFileId) {
        throw new BadRequestError('driveFileId is required.');
      }
      if (!scheduledAt) {
        throw new BadRequestError('scheduledAt is required.');
      }

      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        throw new BadRequestError('scheduledAt is not a valid ISO date string.');
      }

      const job = await SchedulerService.createJob({
        userId,
        driveFileId,
        scheduledAt: scheduledDate,
        timezone: timezone || 'UTC',
        caption: caption || undefined,
      });

      res.status(201).json(ResponseUtil.success('Scheduled job created', job));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/scheduler/jobs
   * List scheduled jobs for the current user.
   */
  public static async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string || '50', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);

      const result = await SchedulerService.listJobs(userId, status, limit, offset);
      res.status(200).json(ResponseUtil.success('Jobs retrieved', result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/scheduler/jobs/:id
   * Get a single job.
   */
  public static async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const { id } = req.params;

      const job = await SchedulerService.getJob(id, userId);
      res.status(200).json(ResponseUtil.success('Job retrieved', job));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/scheduler/jobs/:id
   * Cancel a job.
   */
  public static async cancelJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const { id } = req.params;

      await SchedulerService.cancelJob(id, userId);
      res.status(200).json(ResponseUtil.success('Job cancelled'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/scheduler/jobs/:id/pause
   * Pause a job.
   */
  public static async pauseJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const { id } = req.params;

      await SchedulerService.pauseJob(id, userId);
      res.status(200).json(ResponseUtil.success('Job paused'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/scheduler/jobs/:id/resume
   * Resume a paused job.
   */
  public static async resumeJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const { id } = req.params;

      await SchedulerService.resumeJob(id, userId);
      res.status(200).json(ResponseUtil.success('Job resumed'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/scheduler/jobs/:id/retry
   * Retry a failed job.
   */
  public static async retryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const { id } = req.params;

      await SchedulerService.retryJob(id, userId);
      res.status(200).json(ResponseUtil.success('Job queued for retry'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/scheduler/stats
   * Get queue statistics.
   */
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const { getPrismaClient } = await import('../database/prisma');
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Stats', { pending: 0, processing: 0, published: 0, failed: 0, cancelled: 0, paused: 0 }));
        return;
      }

      const [pending, processing, published, failed, cancelled, paused] = await Promise.all([
        prisma.scheduledJob.count({ where: { userId, status: 'PENDING' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'PROCESSING' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'PUBLISHED' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'FAILED' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'CANCELLED' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'PAUSED' } }),
      ]);

      res.status(200).json(ResponseUtil.success('Queue stats retrieved', {
        pending, processing, published, failed, cancelled, paused,
        total: pending + processing + published + failed + cancelled + paused,
      }));
    } catch (error) {
      next(error);
    }
  }
}
