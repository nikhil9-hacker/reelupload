import { Request, Response, NextFunction } from 'express';
import { DriveSyncService } from '../services/drive-sync.service';
import { getPrismaClient } from '../database/prisma';
import { ResponseUtil } from '../utils/response.util';
import { BadRequestError } from '../utils/error.util';
import { Logger } from '../utils/logger.util';
import { runSyncNow } from '../workers/sync-worker';

export class GoogleDriveController {
  /**
   * GET /api/v1/google-drive/files
   * List synced Drive files for the current user.
   */
  public static async listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();
      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Files retrieved', { files: [], total: 0 }));
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
          orderBy: { lastSeenAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.driveFile.count({ where }),
      ]);

      res.status(200).json(ResponseUtil.success('Drive files retrieved', {
        files: files.map(f => ({
          id: f.id,
          driveFileId: f.driveFileId,
          videoName: f.videoName,
          captionName: f.captionName,
          captionText: f.captionText,
          status: f.status,
          videoSize: f.videoSize ? Number(f.videoSize) : null,
          lastSeenAt: f.lastSeenAt,
          firstSeenAt: f.firstSeenAt,
        })),
        total,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/google-drive/sync
   * Trigger immediate Drive sync for the current user.
   */
  public static async triggerSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        throw new BadRequestError('Database not configured.');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.googleConnected || !user?.driveFolderId) {
        throw new BadRequestError('Google Drive is not connected or no folder is configured.');
      }

      // Run sync in background, return immediately
      runSyncNow(userId).catch((err: any) => {
        Logger.error(`[DriveController] Background sync error for user ${userId}:`, err);
      });

      res.status(200).json(ResponseUtil.success('Drive sync started in background'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/google-drive/sync/wait
   * Trigger and await Drive sync (for testing/immediate feedback).
   */
  public static async triggerSyncAndWait(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        throw new BadRequestError('Database not configured.');
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.googleConnected || !user?.driveFolderId) {
        throw new BadRequestError('Google Drive is not connected or no folder is configured.');
      }

      const result = await DriveSyncService.syncUserFolder(userId);
      res.status(200).json(ResponseUtil.success('Drive sync completed', result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/google-drive/status
   * Get sync status and stats.
   */
  public static async getSyncStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        res.status(200).json(ResponseUtil.success('Sync status', { configured: false }));
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const [total, paired, unpaired] = await Promise.all([
        prisma.driveFile.count({ where: { userId } }),
        prisma.driveFile.count({ where: { userId, status: 'PAIRED' } }),
        prisma.driveFile.count({ where: { userId, status: 'UNPAIRED' } }),
      ]);

      res.status(200).json(ResponseUtil.success('Sync status retrieved', {
        configured: !!(user?.googleConnected && user?.driveFolderId),
        folderId: user?.driveFolderId || null,
        folderName: user?.driveFolderName || null,
        lastSyncAt: user?.lastSyncAt || null,
        stats: { total, paired, unpaired },
      }));
    } catch (error) {
      next(error);
    }
  }
}
