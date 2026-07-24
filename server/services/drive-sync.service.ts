import { getPrismaClient } from '../database/prisma';
import { GoogleApiService } from './google.service';
import { CryptoUtil } from '../utils/crypto.util';
import { Logger } from '../utils/logger.util';

export interface DriveFileEntry {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

export interface DriveFilePair {
  videoFile: DriveFileEntry;
  captionFile?: DriveFileEntry;
  captionText?: string;
}

export class DriveSyncService {
  private static readonly DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
  private static readonly DRIVE_DOWNLOAD_BASE = 'https://www.googleapis.com/drive/v3/files';

  /**
   * Get a valid (possibly refreshed) Google access token for a user.
   */
  private static async getAccessToken(userId: string): Promise<string | null> {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.googleConnected || !user.googleAccessToken) return null;

    const decryptedAccessToken = CryptoUtil.decrypt(user.googleAccessToken);
    const decryptedRefreshToken = CryptoUtil.decrypt(user.googleRefreshToken);

    const now = new Date();
    const isExpired =
      !decryptedAccessToken ||
      !user.googleTokenExpiry ||
      new Date(user.googleTokenExpiry.getTime() - 300000) <= now;

    if (isExpired && decryptedRefreshToken) {
      Logger.info(`[DriveSync] Refreshing Google token for user ${userId}...`);
      const refreshed = await GoogleApiService.refreshAccessToken(decryptedRefreshToken);
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: CryptoUtil.encrypt(refreshed.accessToken),
          googleTokenExpiry: refreshed.expiresAt,
        },
      });
      return refreshed.accessToken;
    }

    return decryptedAccessToken;
  }

  /**
   * List all files in a Google Drive folder.
   */
  public static async listFolderFiles(
    accessToken: string,
    folderId: string
  ): Promise<DriveFileEntry[]> {
    const url = `${this.DRIVE_API_BASE}/files?q=${encodeURIComponent(
      `'${folderId}' in parents and trashed=false`
    )}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=100`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      Logger.error('[DriveSync] Failed to list folder files:', err);
      throw new Error(`Drive API error: ${(err as any)?.error?.message || res.statusText}`);
    }

    const data = (await res.json()) as { files: DriveFileEntry[] };
    return data.files || [];
  }

  /**
   * Download text content of a Drive file (for caption .txt files).
   */
  public static async downloadTextFile(
    accessToken: string,
    fileId: string
  ): Promise<string> {
    const url = `${this.DRIVE_DOWNLOAD_BASE}/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to download caption file: ${res.statusText}`);
    }
    return res.text();
  }

  /**
   * Get a public download URL for a Drive video file.
   * This is used by the Instagram publishing flow.
   */
  public static async getVideoDownloadUrl(
    accessToken: string,
    fileId: string
  ): Promise<string> {
    // Return a direct Drive download URL that works with the access token
    return `${this.DRIVE_DOWNLOAD_BASE}/${fileId}?alt=media&access_token=${accessToken}`;
  }

  /**
   * Pair MP4 and TXT files by base name (without extension).
   */
  private static pairFiles(files: DriveFileEntry[]): DriveFilePair[] {
    const mp4Files = files.filter(
      (f) => f.mimeType === 'video/mp4' || f.name.toLowerCase().endsWith('.mp4')
    );
    const txtFiles = files.filter(
      (f) =>
        f.mimeType === 'text/plain' ||
        f.name.toLowerCase().endsWith('.txt')
    );

    const pairs: DriveFilePair[] = [];

    for (const mp4 of mp4Files) {
      const baseName = mp4.name.replace(/\.mp4$/i, '');
      const txtFile = txtFiles.find(
        (t) => t.name.replace(/\.txt$/i, '') === baseName
      );
      pairs.push({
        videoFile: mp4,
        captionFile: txtFile,
      });
    }

    return pairs;
  }

  /**
   * Main sync operation — reads folder, pairs files, upserts DB records.
   */
  public static async syncUserFolder(userId: string): Promise<{
    synced: number;
    paired: number;
    unpaired: number;
    errors: string[];
  }> {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error('Database not configured.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.driveFolderId) {
      throw new Error(`User ${userId} has no Drive folder configured.`);
    }

    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) {
      throw new Error(`Could not get valid Google access token for user ${userId}.`);
    }

    Logger.info(`[DriveSync] Syncing folder "${user.driveFolderName}" for user ${userId}...`);

    const files = await this.listFolderFiles(accessToken, user.driveFolderId);
    const pairs = this.pairFiles(files);

    let synced = 0;
    let paired = 0;
    let unpaired = 0;
    const errors: string[] = [];

    for (const pair of pairs) {
      try {
        let captionText: string | undefined;

        if (pair.captionFile) {
          try {
            captionText = await this.downloadTextFile(accessToken, pair.captionFile.id);
          } catch (captionErr: any) {
            Logger.warn(`[DriveSync] Could not download caption for ${pair.videoFile.name}: ${captionErr.message}`);
          }
        }

        const status = pair.captionFile ? 'PAIRED' : 'UNPAIRED';
        const pairHash = pair.captionFile
          ? `${pair.videoFile.id}:${pair.captionFile.id}`
          : pair.videoFile.id;

        await prisma.driveFile.upsert({
          where: { driveFileId: pair.videoFile.id },
          create: {
            userId,
            driveFileId: pair.videoFile.id,
            videoName: pair.videoFile.name,
            videoMimeType: pair.videoFile.mimeType,
            videoSize: pair.videoFile.size ? BigInt(pair.videoFile.size) : null,
            captionFileId: pair.captionFile?.id || null,
            captionName: pair.captionFile?.name || null,
            captionText: captionText || null,
            pairHash,
            status,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          },
          update: {
            videoName: pair.videoFile.name,
            videoMimeType: pair.videoFile.mimeType,
            videoSize: pair.videoFile.size ? BigInt(pair.videoFile.size) : undefined,
            captionFileId: pair.captionFile?.id || null,
            captionName: pair.captionFile?.name || null,
            captionText: captionText !== undefined ? captionText : undefined,
            pairHash,
            status,
            lastSeenAt: new Date(),
          },
        });

        synced++;
        if (status === 'PAIRED') paired++;
        else unpaired++;
      } catch (err: any) {
        Logger.error(`[DriveSync] Error processing file ${pair.videoFile.name}:`, err);
        errors.push(`${pair.videoFile.name}: ${err.message}`);
      }
    }

    // Update user's last sync time
    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncAt: new Date() },
    });

    Logger.info(
      `[DriveSync] Completed for user ${userId}: ${synced} files synced (${paired} paired, ${unpaired} unpaired)`
    );

    return { synced, paired, unpaired, errors };
  }

  /**
   * Sync all users who have both Google and Drive configured.
   */
  public static async syncAllUsers(): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma) return;

    const users = await prisma.user.findMany({
      where: {
        googleConnected: true,
        googleDriveConnected: true,
        driveFolderId: { not: null },
      },
      select: { id: true },
    });

    Logger.info(`[DriveSync] Running global sync for ${users.length} users...`);

    for (const user of users) {
      try {
        await this.syncUserFolder(user.id);
      } catch (err: any) {
        Logger.error(`[DriveSync] Failed sync for user ${user.id}:`, err);
      }
    }
  }
}
