import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../database/prisma';
import { ResponseUtil } from '../utils/response.util';
import { isSyncWorkerRunning } from '../workers/sync-worker';
import { isSchedulerWorkerRunning } from '../workers/scheduler-worker';

export class DashboardController {
  /**
   * GET /api/v1/dashboard/stats
   * Aggregate stats for the dashboard overview cards.
   */
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Dashboard stats', {
          jobs: { pending: 0, processing: 0, published: 0, failed: 0, cancelled: 0, paused: 0 },
          drive: { total: 0, paired: 0, unpaired: 0 },
          connections: { instagram: false, google: false, driveFolder: null },
          workers: { syncRunning: false, schedulerRunning: false },
        }));
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      const [
        pending, processing, published, failed, cancelled, paused,
        driveTotal, drivePaired, driveUnpaired,
      ] = await Promise.all([
        prisma.scheduledJob.count({ where: { userId, status: 'PENDING' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'PROCESSING' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'PUBLISHED' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'FAILED' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'CANCELLED' } }),
        prisma.scheduledJob.count({ where: { userId, status: 'PAUSED' } }),
        prisma.driveFile.count({ where: { userId } }),
        prisma.driveFile.count({ where: { userId, status: 'PAIRED' } }),
        prisma.driveFile.count({ where: { userId, status: 'UNPAIRED' } }),
      ]);

      res.status(200).json(ResponseUtil.success('Dashboard stats retrieved', {
        jobs: { pending, processing, published, failed, cancelled, paused },
        drive: { total: driveTotal, paired: drivePaired, unpaired: driveUnpaired },
        connections: {
          instagram: user?.instagramConnected ?? false,
          instagramUsername: user?.instagramUsername ?? null,
          google: user?.googleConnected ?? false,
          googleEmail: user?.googleEmail ?? null,
          driveFolder: user?.driveFolderName ?? null,
          driveFolderId: user?.driveFolderId ?? null,
          lastSyncAt: user?.lastSyncAt ?? null,
        },
        workers: {
          syncRunning: isSyncWorkerRunning(),
          schedulerRunning: isSchedulerWorkerRunning(),
        },
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/queue
   * Get the upcoming publishing queue.
   */
  public static async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Queue', { jobs: [], total: 0 }));
        return;
      }

      const limit = parseInt(req.query.limit as string || '20', 10);

      const [jobs, total] = await Promise.all([
        prisma.scheduledJob.findMany({
          where: {
            userId,
            status: { in: ['PENDING', 'PROCESSING', 'PAUSED'] },
          },
          include: { driveFile: true },
          orderBy: { scheduledAt: 'asc' },
          take: limit,
        }),
        prisma.scheduledJob.count({
          where: { userId, status: { in: ['PENDING', 'PROCESSING', 'PAUSED'] } },
        }),
      ]);

      res.status(200).json(ResponseUtil.success('Queue retrieved', {
        jobs: jobs.map(j => ({
          id: j.id,
          status: j.status,
          scheduledAt: j.scheduledAt,
          timezone: j.timezone,
          caption: j.caption,
          videoName: j.driveFile.videoName,
          captionText: j.driveFile.captionText,
          retries: j.retries,
          errorLog: j.errorLog,
        })),
        total,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/activity
   * Get recent activity log (all statuses, for timeline display).
   */
  public static async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Activity', { events: [] }));
        return;
      }

      const limit = parseInt(req.query.limit as string || '30', 10);

      const jobs = await prisma.scheduledJob.findMany({
        where: { userId },
        include: { driveFile: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      const events = jobs.map(job => ({
        id: job.id,
        type: job.status,
        videoName: job.driveFile.videoName,
        scheduledAt: job.scheduledAt,
        publishedAt: job.publishedAt,
        updatedAt: job.updatedAt,
        instagramMediaId: job.instagramMediaId,
        errorLog: job.errorLog,
        retries: job.retries,
      }));

      res.status(200).json(ResponseUtil.success('Activity log retrieved', { events }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/files
   * Get all drive files (for library/content view).
   */
  public static async getFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Files', { files: [], total: 0 }));
        return;
      }

      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string || '50', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);

      const where: any = { userId };
      if (status && status !== 'all') {
        where.status = status.toUpperCase();
      }

      const [files, total] = await Promise.all([
        prisma.driveFile.findMany({
          where,
          include: {
            jobs: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Most recent job
            },
          },
          orderBy: { lastSeenAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.driveFile.count({ where }),
      ]);

      res.status(200).json(ResponseUtil.success('Files retrieved', {
        files: files.map(f => ({
          id: f.id,
          driveFileId: f.driveFileId,
          videoName: f.videoName,
          captionName: f.captionName,
          captionText: f.captionText,
          status: f.status,
          videoSize: f.videoSize ? Number(f.videoSize) : null,
          lastSeenAt: f.lastSeenAt,
          latestJob: f.jobs[0] ? {
            id: f.jobs[0].id,
            status: f.jobs[0].status,
            scheduledAt: f.jobs[0].scheduledAt,
            publishedAt: f.jobs[0].publishedAt,
          } : null,
        })),
        total,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/logs
   * Get published/failed job logs (for UploadLogs page).
   */
  public static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Logs', { logs: [], total: 0 }));
        return;
      }

      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string || '50', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);

      const where: any = { userId };
      if (status && status !== 'all') {
        where.status = status.toUpperCase();
      } else {
        // Default: show completed/failed jobs for logs
        where.status = { in: ['PUBLISHED', 'FAILED', 'CANCELLED'] };
      }

      const [logs, total] = await Promise.all([
        prisma.scheduledJob.findMany({
          where,
          include: { driveFile: true },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.scheduledJob.count({ where }),
      ]);

      res.status(200).json(ResponseUtil.success('Logs retrieved', {
        logs: logs.map(j => ({
          id: j.id,
          status: j.status,
          videoName: j.driveFile.videoName,
          caption: j.caption || j.driveFile.captionText,
          scheduledAt: j.scheduledAt,
          publishedAt: j.publishedAt,
          instagramMediaId: j.instagramMediaId,
          errorLog: j.errorLog,
          retries: j.retries,
          updatedAt: j.updatedAt,
        })),
        total,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/calendar
   * Get scheduled jobs for calendar view.
   */
  public static async getCalendarJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Calendar', { jobs: [] }));
        return;
      }

      // Support optional query params for date range, defaulting to past 30 days and next 60 days
      const fromParam = req.query.from as string;
      const toParam = req.query.to as string;
      const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = toParam ? new Date(toParam) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      const jobs = await prisma.scheduledJob.findMany({
        where: {
          userId,
          scheduledAt: { gte: from, lte: to },
          status: { in: ['PENDING', 'PROCESSING', 'PAUSED', 'PUBLISHED', 'FAILED', 'CANCELLED'] },
        },
        include: { driveFile: true },
        orderBy: { scheduledAt: 'asc' },
      });

      res.status(200).json(ResponseUtil.success('Calendar jobs retrieved', {
        jobs: jobs.map(j => ({
          id: j.id,
          status: j.status,
          scheduledAt: j.scheduledAt,
          timezone: j.timezone,
          videoName: j.driveFile.videoName,
          caption: j.caption || j.driveFile.captionText,
          publishedAt: j.publishedAt,
          instagramMediaId: j.instagramMediaId,
        })),
      }));
    } catch (error) {
      next(error);
    }
  }
}
