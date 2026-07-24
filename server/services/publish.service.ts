import { getPrismaClient } from '../database/prisma';
import { DriveSyncService } from './drive-sync.service';
import { GoogleApiService } from './google.service';
import { CryptoUtil } from '../utils/crypto.util';
import { MetaApiService } from './meta.service';
import { Logger } from '../utils/logger.util';

export interface PublishResult {
  mediaId: string;
  publishedAt: Date;
}

export class PublishService {
  private static readonly IG_GRAPH_BASE = 'https://graph.instagram.com/v20.0';

  /**
   * Get a valid Instagram access token for the user, refreshing if needed.
   */
  private static async getInstagramToken(user: any): Promise<string> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const decryptedToken = CryptoUtil.decrypt(user.accessToken);
    if (!decryptedToken) throw new Error('Instagram access token not found or could not be decrypted.');

    const now = Date.now();
    const expiry = user.tokenExpiry ? new Date(user.tokenExpiry).getTime() : 0;
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

    if (expiry && (expiry - now < fifteenDaysMs)) {
      Logger.info(`[PublishService] Instagram token expiring soon for user ${user.id}. Refreshing...`);
      try {
        const refreshed = await MetaApiService.refreshLongLivedToken(decryptedToken);
        const newExpiry = new Date(Date.now() + refreshed.expiresInSeconds * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            accessToken: CryptoUtil.encrypt(refreshed.accessToken),
            tokenExpiry: newExpiry,
          },
        });
        return refreshed.accessToken;
      } catch (refreshErr: any) {
        Logger.warn(`[PublishService] Token refresh failed, using existing token: ${refreshErr.message}`);
      }
    }

    return decryptedToken;
  }

  /**
   * Get a valid Google access token for the user, refreshing if needed.
   */
  private static async getGoogleToken(user: any): Promise<string> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database not configured.');

    const decryptedAccessToken = CryptoUtil.decrypt(user.googleAccessToken);
    const decryptedRefreshToken = CryptoUtil.decrypt(user.googleRefreshToken);

    const now = new Date();
    const isExpired =
      !decryptedAccessToken ||
      !user.googleTokenExpiry ||
      new Date(user.googleTokenExpiry.getTime() - 300000) <= now;

    if (isExpired && decryptedRefreshToken) {
      Logger.info(`[PublishService] Refreshing Google token for user ${user.id}...`);
      const refreshed = await GoogleApiService.refreshAccessToken(decryptedRefreshToken);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleAccessToken: CryptoUtil.encrypt(refreshed.accessToken),
          googleTokenExpiry: refreshed.expiresAt,
        },
      });
      return refreshed.accessToken;
    }

    if (!decryptedAccessToken) throw new Error('Google access token not found.');
    return decryptedAccessToken;
  }

  /**
   * Create an Instagram Reel container.
   * Returns the container ID.
   */
  private static async createReelContainer(
    igUserId: string,
    accessToken: string,
    videoUrl: string,
    caption: string
  ): Promise<string> {
    const url = `${this.IG_GRAPH_BASE}/${igUserId}/media`;
    const params = new URLSearchParams({
      media_type: 'REELS',
      video_url: videoUrl,
      caption: caption.substring(0, 2200), // Instagram caption limit
      access_token: accessToken,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = (await res.json()) as any;
    if (!res.ok || data.error) {
      Logger.error('[PublishService] Failed to create Reel container:', data.error);
      throw new Error(
        `Instagram container creation failed: ${data.error?.message || data.error?.code || 'Unknown error'}`
      );
    }

    Logger.info(`[PublishService] Created container ${data.id} for Reel`);
    return data.id;
  }

  /**
   * Poll container status until FINISHED or ERROR.
   */
  private static async waitForContainerReady(
    containerId: string,
    accessToken: string,
    maxAttempts = 20,
    intervalMs = 5000
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      const url = `${this.IG_GRAPH_BASE}/${containerId}?fields=status_code,status&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;

      Logger.info(`[PublishService] Container ${containerId} status: ${data.status_code}`);

      if (data.status_code === 'FINISHED') {
        return;
      }
      if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
        throw new Error(
          `Instagram container processing failed with status: ${data.status_code}. ${data.status || ''}`
        );
      }
      if (data.error) {
        throw new Error(`Container status check error: ${data.error?.message || 'Unknown'}`);
      }
    }

    throw new Error('Reel container processing timed out after maximum polling attempts.');
  }

  /**
   * Publish the container as a Reel.
   * Returns the Instagram Media ID.
   */
  private static async publishContainer(
    igUserId: string,
    containerId: string,
    accessToken: string
  ): Promise<string> {
    const url = `${this.IG_GRAPH_BASE}/${igUserId}/media_publish`;
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = (await res.json()) as any;
    if (!res.ok || data.error) {
      Logger.error('[PublishService] Failed to publish Reel:', data.error);
      throw new Error(
        `Instagram publish failed: ${data.error?.message || data.error?.code || 'Unknown error'}`
      );
    }

    Logger.info(`[PublishService] Reel published! Media ID: ${data.id}`);
    return data.id;
  }

  /**
   * Main publish flow:
   * 1. Get fresh tokens
   * 2. Build Drive download URL for the video
   * 3. Create Instagram Reel container
   * 4. Poll until processing complete
   * 5. Publish to Instagram
   */
  public static async publishReel(
    user: any,
    driveFile: any,
    caption: string
  ): Promise<PublishResult> {
    if (!user.instagramConnected || !user.accessToken) {
      throw new Error('Instagram is not connected for this user.');
    }
    if (!user.instagramUserId) {
      throw new Error('Instagram User ID is missing. Please reconnect Instagram.');
    }
    if (!user.googleConnected) {
      throw new Error('Google Drive is not connected for this user.');
    }

    Logger.info(`[PublishService] Starting publish for file: ${driveFile.videoName}`);

    // 1. Get tokens
    const [igToken, googleToken] = await Promise.all([
      this.getInstagramToken(user),
      this.getGoogleToken(user),
    ]);

    // 2. Build Drive video URL
    const videoUrl = await DriveSyncService.getVideoDownloadUrl(googleToken, driveFile.driveFileId);

    // 3. Create container
    const containerId = await this.createReelContainer(
      user.instagramUserId,
      igToken,
      videoUrl,
      caption || driveFile.captionText || driveFile.videoName
    );

    // 4. Wait for container to be ready
    await this.waitForContainerReady(containerId, igToken);

    // 5. Publish
    const mediaId = await this.publishContainer(user.instagramUserId, containerId, igToken);

    return {
      mediaId,
      publishedAt: new Date(),
    };
  }
}
