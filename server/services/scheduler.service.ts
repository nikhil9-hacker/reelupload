import { getPrismaClient } from '../database/prisma';
import { PublishService } from './publish.service';
import { Logger } from '../utils/logger.util';
import { BadRequestError, NotFoundError } from '../utils/error.util';

export interface CreateJobInput {
  userId: string;
  driveFileId: string;  // This is the DB DriveFile.id (UUID)
  scheduledAt: Date;
  timezone?: string;
  caption?: string;
}

export interface JobResult {
  id: string;
  status: string;
  scheduledAt: Date;
  timezone: string;
  caption: string | null;
  driveFileId: string;
  driveFileName: string;
  retries: number;
  errorLog: string | null;
  publishedAt: Date | null;
  instagramMediaId: string | null;
  createdAt: Date;
}

export class SchedulerService {
  /**
   * Create a new scheduled publishing job.
   */
  public static async createJob(input: CreateJobInput): Promise<JobResult> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const driveFile = await prisma.driveFile.findUnique({
      where: { id: input.driveFileId },
    });
    if (!driveFile) {
      throw new NotFoundError(`Drive file not found: ${input.driveFileId}`);
    }
    if (driveFile.userId !== input.userId) {
      throw new BadRequestError('Drive file does not belong to this user.');
    }

    // Use caption from drive file if not provided
    const caption = input.caption || driveFile.captionText || '';

    const job = await prisma.scheduledJob.create({
      data: {
        userId: input.userId,
        driveFileId: input.driveFileId,
        scheduledAt: input.scheduledAt,
        timezone: input.timezone || 'UTC',
        caption,
        status: 'PENDING',
      },
      include: { driveFile: true },
    });

    Logger.info(`[Scheduler] Job ${job.id} created for file ${driveFile.videoName} at ${input.scheduledAt.toISOString()}`);

    return this.formatJob(job);
  }

  /**
   * Cancel a job.
   */
  public static async cancelJob(jobId: string, userId: string): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const job = await prisma.scheduledJob.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) throw new NotFoundError('Job not found.');
    if (job.status === 'PUBLISHED') {
      throw new BadRequestError('Cannot cancel a published job.');
    }

    await prisma.scheduledJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });
    Logger.info(`[Scheduler] Job ${jobId} cancelled.`);
  }

  /**
   * Pause a pending job.
   */
  public static async pauseJob(jobId: string, userId: string): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const job = await prisma.scheduledJob.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new NotFoundError('Job not found.');
    if (job.status !== 'PENDING') throw new BadRequestError('Only PENDING jobs can be paused.');

    await prisma.scheduledJob.update({ where: { id: jobId }, data: { status: 'PAUSED' } });
    Logger.info(`[Scheduler] Job ${jobId} paused.`);
  }

  /**
   * Resume a paused job.
   */
  public static async resumeJob(jobId: string, userId: string): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const job = await prisma.scheduledJob.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new NotFoundError('Job not found.');
    if (job.status !== 'PAUSED') throw new BadRequestError('Only PAUSED jobs can be resumed.');

    await prisma.scheduledJob.update({ where: { id: jobId }, data: { status: 'PENDING' } });
    Logger.info(`[Scheduler] Job ${jobId} resumed.`);
  }

  /**
   * Retry a failed job.
   */
  public static async retryJob(jobId: string, userId: string): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const job = await prisma.scheduledJob.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new NotFoundError('Job not found.');
    if (job.status !== 'FAILED') throw new BadRequestError('Only FAILED jobs can be retried.');

    await prisma.scheduledJob.update({
      where: { id: jobId },
      data: { status: 'PENDING', errorLog: null },
    });
    Logger.info(`[Scheduler] Job ${jobId} queued for retry.`);
  }

  /**
   * List jobs for a user with optional status filter.
   */
  public static async listJobs(
    userId: string,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<{ jobs: JobResult[]; total: number }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const where: any = { userId };
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [jobs, total] = await Promise.all([
      prisma.scheduledJob.findMany({
        where,
        include: { driveFile: true },
        orderBy: { scheduledAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.scheduledJob.count({ where }),
    ]);

    return {
      jobs: jobs.map(this.formatJob),
      total,
    };
  }

  /**
   * Get a single job.
   */
  public static async getJob(jobId: string, userId: string): Promise<JobResult> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const job = await prisma.scheduledJob.findFirst({
      where: { id: jobId, userId },
      include: { driveFile: true },
    });
    if (!job) throw new NotFoundError('Job not found.');
    return this.formatJob(job);
  }

  /**
   * Process the job queue — picks all due PENDING jobs and publishes them.
   * Called by the scheduler worker every minute.
   */
  public static async processQueue(): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma) return;

    const dueJobs = await prisma.scheduledJob.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      include: {
        driveFile: true,
        user: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10, // Process up to 10 at a time
    });

    if (dueJobs.length === 0) return;

    Logger.info(`[Scheduler] Processing ${dueJobs.length} due jobs...`);

    for (const job of dueJobs) {
      // Mark as PROCESSING
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING' },
      });

      try {
        const result = await PublishService.publishReel(job.user, job.driveFile, job.caption || job.driveFile.captionText || '');

        await prisma.scheduledJob.update({
          where: { id: job.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            instagramMediaId: result.mediaId,
            errorLog: null,
          },
        });

        Logger.info(`[Scheduler] Job ${job.id} published successfully. Media ID: ${result.mediaId}`);
      } catch (err: any) {
        const retries = job.retries + 1;
        const newStatus = retries >= job.maxRetries ? 'FAILED' : 'PENDING';

        await prisma.scheduledJob.update({
          where: { id: job.id },
          data: {
            status: newStatus,
            retries,
            errorLog: err.message || 'Unknown publish error',
            // Reschedule 5 min later if not max retries
            scheduledAt: newStatus === 'PENDING'
              ? new Date(Date.now() + 5 * 60 * 1000)
              : job.scheduledAt,
          },
        });

        Logger.error(`[Scheduler] Job ${job.id} failed (attempt ${retries}/${job.maxRetries}): ${err.message}`);
      }
    }
  }

  private static formatJob(job: any): JobResult {
    return {
      id: job.id,
      status: job.status,
      scheduledAt: job.scheduledAt,
      timezone: job.timezone,
      caption: job.caption,
      driveFileId: job.driveFileId,
      driveFileName: job.driveFile?.videoName || 'Unknown',
      retries: job.retries,
      errorLog: job.errorLog,
      publishedAt: job.publishedAt,
      instagramMediaId: job.instagramMediaId,
      createdAt: job.createdAt,
    };
  }
}
