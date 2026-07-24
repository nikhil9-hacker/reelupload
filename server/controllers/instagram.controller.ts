import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../database/prisma';
import { ResponseUtil } from '../utils/response.util';
import { BadRequestError } from '../utils/error.util';
import { Logger } from '../utils/logger.util';

export class InstagramController {
  /**
   * GET /api/v1/instagram/reels
   * List reels from Instagram Graph API (published reels).
   */
  public static async listReels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Reels', { reels: [] }));
        return;
      }

      // Return published jobs with Instagram Media IDs
      const publishedJobs = await prisma.scheduledJob.findMany({
        where: { userId, status: 'PUBLISHED', instagramMediaId: { not: null } },
        include: { driveFile: true },
        orderBy: { publishedAt: 'desc' },
        take: 50,
      });

      const reels = publishedJobs.map(job => ({
        id: job.id,
        instagramMediaId: job.instagramMediaId,
        videoName: job.driveFile.videoName,
        caption: job.caption || job.driveFile.captionText || '',
        publishedAt: job.publishedAt,
        status: job.status,
      }));

      res.status(200).json(ResponseUtil.success('Reels retrieved', { reels }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/instagram/status
   * Get Instagram account connection status with token validity check.
   */
  public static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Instagram status', { connected: false }));
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.instagramConnected) {
        res.status(200).json(ResponseUtil.success('Instagram status', { connected: false }));
        return;
      }

      const now = Date.now();
      const expiry = user.tokenExpiry ? new Date(user.tokenExpiry).getTime() : 0;
      const daysUntilExpiry = expiry ? Math.floor((expiry - now) / (1000 * 60 * 60 * 24)) : null;

      res.status(200).json(ResponseUtil.success('Instagram status retrieved', {
        connected: true,
        username: user.instagramUsername,
        userId: user.instagramUserId,
        facebookPageName: user.facebookPageName,
        tokenExpiry: user.tokenExpiry,
        daysUntilExpiry,
        tokenHealthy: daysUntilExpiry !== null && daysUntilExpiry > 0,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/instagram/publish/:jobId
   * Manually trigger publish for a specific job (for testing).
   */
  public static async manualPublish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const { jobId } = req.params;
      const prisma = getPrismaClient();

      if (!prisma) throw new BadRequestError('Database not configured.');

      const job = await prisma.scheduledJob.findFirst({
        where: { id: jobId, userId },
        include: { driveFile: true, user: true },
      });

      if (!job) throw new BadRequestError('Job not found or does not belong to this user.');
      if (job.status === 'PUBLISHED') throw new BadRequestError('Job is already published.');
      if (job.status === 'PROCESSING') throw new BadRequestError('Job is currently being processed.');

      // Mark as processing
      await prisma.scheduledJob.update({ where: { id: jobId }, data: { status: 'PROCESSING' } });

      // Publish in background
      const { PublishService } = await import('../services/publish.service');
      PublishService.publishReel(job.user, job.driveFile, job.caption || job.driveFile.captionText || '')
        .then(async (result) => {
          await prisma.scheduledJob.update({
            where: { id: jobId },
            data: {
              status: 'PUBLISHED',
              publishedAt: result.publishedAt,
              instagramMediaId: result.mediaId,
              errorLog: null,
            },
          });
          Logger.info(`[InstagramController] Manual publish succeeded for job ${jobId}`);
        })
        .catch(async (err: any) => {
          const retries = job.retries + 1;
          await prisma.scheduledJob.update({
            where: { id: jobId },
            data: {
              status: retries >= job.maxRetries ? 'FAILED' : 'PENDING',
              retries,
              errorLog: err.message,
            },
          });
          Logger.error(`[InstagramController] Manual publish failed for job ${jobId}:`, err);
        });

      res.status(200).json(ResponseUtil.success('Publish started', { jobId }));
    } catch (error) {
      next(error);
    }
  }
}
