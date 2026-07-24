import { getPrismaClient } from '../database/prisma';
import { InstagramBusinessProfile, MetaApiService } from './meta.service';
import { CryptoUtil } from '../utils/crypto.util';
import { Logger } from '../utils/logger.util';

export class InstagramService {
  /**
   * Persists connected Instagram Professional details & access token in database.
   * Encrypts the access token before saving.
   */
  public async saveUserInstagramConnection(
    userId: string,
    profile: InstagramBusinessProfile
  ): Promise<void> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const encryptedToken = CryptoUtil.encrypt(profile.longLivedToken);

        await prisma.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: 'guest-user@reelpilot.com',
            instagramConnected: true,
            instagramUserId: profile.id,
            instagramUsername: profile.username,
            facebookPageId: profile.facebookPageId,
            facebookPageName: profile.facebookPageName,
            accessToken: encryptedToken,
            tokenExpiry: profile.expiresAt,
            connectedAt: new Date(),
          },
          update: {
            instagramConnected: true,
            instagramUserId: profile.id,
            instagramUsername: profile.username,
            facebookPageId: profile.facebookPageId,
            facebookPageName: profile.facebookPageName,
            accessToken: encryptedToken,
            tokenExpiry: profile.expiresAt,
            connectedAt: new Date(),
          },
        });
        Logger.info(`[InstagramService] Database updated: Saved encrypted Instagram token for @${profile.username} (User: ${userId})`);
      } catch (dbErr) {
        Logger.error('[InstagramService] Database update skipped or user not found:', dbErr as Error);
      }
    } else {
      Logger.warn('[InstagramService] DATABASE_URL not configured. Session updated without DB persistence.');
    }
  }

  /**
   * Disconnects Instagram channel and revokes tokens.
   */
  public async disconnectInstagramConnection(userId: string): Promise<void> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: 'guest-user@reelpilot.com',
            instagramConnected: false,
          },
          update: {
            instagramConnected: false,
            instagramUserId: null,
            instagramUsername: null,
            facebookPageId: null,
            facebookPageName: null,
            accessToken: null,
            tokenExpiry: null,
            connectedAt: null,
          },
        });
        Logger.info(`[InstagramService] Database updated: Disconnected Instagram for user ${userId}`);
      } catch (dbErr) {
        Logger.error('[InstagramService] Database disconnect update skipped:', dbErr as Error);
      }
    }
  }

  /**
   * Checks connection status, decrypts the token, and automatically refreshes it if expiring within 15 days.
   */
  public async getAndRefreshActiveToken(userId: string): Promise<string | null> {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.instagramConnected || !user.accessToken) {
        return null;
      }

      const decryptedToken = CryptoUtil.decrypt(user.accessToken);
      if (!decryptedToken) return null;

      const now = Date.now();
      const expiry = user.tokenExpiry ? new Date(user.tokenExpiry).getTime() : 0;
      const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

      // If token is expiring in less than 15 days, refresh it automatically!
      if (expiry && (expiry - now < fifteenDaysMs)) {
        Logger.info(`[InstagramService] Token for user ${userId} is expiring soon. Automatically refreshing...`);
        try {
          const refreshed = await MetaApiService.refreshLongLivedToken(decryptedToken);
          const encryptedNewToken = CryptoUtil.encrypt(refreshed.accessToken);
          const newExpiry = new Date(Date.now() + refreshed.expiresInSeconds * 1000);

          await prisma.user.update({
            where: { id: userId },
            data: {
              accessToken: encryptedNewToken,
              tokenExpiry: newExpiry,
            },
          });

          Logger.info(`[InstagramService] Successfully auto-refreshed Instagram token for user ${userId}.`);
          return refreshed.accessToken;
        } catch (refreshErr) {
          Logger.error(`[InstagramService] Failed to auto-refresh token for user ${userId}:`, refreshErr as Error);
        }
      }

      return decryptedToken;
    } catch (err) {
      Logger.error(`[InstagramService] Error checking/refreshing token for user ${userId}:`, err as Error);
      return null;
    }
  }
}

export const instagramService = new InstagramService();
