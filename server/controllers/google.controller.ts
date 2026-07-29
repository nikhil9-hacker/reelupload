import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { envConfig } from '../config/env.config';
import { GoogleApiService } from '../services/google.service';
import { getPrismaClient } from '../database/prisma';
import { CryptoUtil } from '../utils/crypto.util';
import { ResponseUtil } from '../utils/response.util';
import { BadRequestError } from '../utils/error.util';
import { Logger } from '../utils/logger.util';

/**
 * Returns the correct base origin for OAuth redirect URIs.
 * Uses APP_URL from env config which is always https in production.
 * Avoids req.protocol which returns 'http' behind Railway reverse proxies.
 */
function getCanonicalRedirectUri(req: Request): string {
  const callbackPath = '/api/v1/google/callback';

  if (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) {
    const cleanUrl = process.env.APP_URL.trim().replace(/\/$/, '').replace(/^http:\/\//, 'https://');
    return `${cleanUrl}${callbackPath}`;
  }

  const host = req.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  if (!isLocal) {
    const cleanHost = host.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${cleanHost}${callbackPath}`;
  }

  const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol;
  return `${proto}://${host}${callbackPath}`;
}

export class GoogleAuthController {
  /**
   * GET /api/v1/google/status
   * Returns current Google connection status, email, and selected folder details.
   */
  public static async getGoogleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.session?.onboardingFinished) {
        const temp = req.session?.tempGoogle;
        res.status(200).json(
          ResponseUtil.success('Google connection status retrieved from temporary session', {
            googleConnected: !!temp,
            email: temp?.email || null,
            folderId: temp?.folderId || null,
            folderName: temp?.folderName || null,
          })
        );
        return;
      }

      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      let googleConnected = false;
      let email: string | null = null;
      let folderId: string | null = null;
      let folderName: string | null = null;

      if (prisma) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (user) {
          googleConnected = user.googleConnected;
          email = user.googleEmail;
          folderId = user.driveFolderId;
          folderName = user.driveFolderName;
        }
      }

      res.status(200).json(
        ResponseUtil.success('Google connection status retrieved', {
          googleConnected,
          email,
          folderId,
          folderName,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/google/token
   * Returns active google access token, refreshing it automatically if expired.
   */
  public static async getGoogleToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.session?.onboardingFinished) {
        const temp = req.session?.tempGoogle;
        if (!temp) {
          throw new BadRequestError('Google Drive is not linked for this temporary session.');
        }
        const decryptedAccessToken = CryptoUtil.decrypt(temp.googleAccessToken);
        res.status(200).json(ResponseUtil.success('Google access token retrieved from temporary session', { accessToken: decryptedAccessToken }));
        return;
      }

      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        throw new BadRequestError('Database is not configured. Cannot retrieve Google access token.');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.googleConnected) {
        throw new BadRequestError('Google Drive is not linked for this session.');
      }

      const decryptedAccessToken = CryptoUtil.decrypt(user.googleAccessToken);
      const decryptedRefreshToken = CryptoUtil.decrypt(user.googleRefreshToken);

      const now = new Date();
      const isExpired = !decryptedAccessToken || !user.googleTokenExpiry || new Date(user.googleTokenExpiry.getTime() - 300000) <= now;

      if (isExpired && decryptedRefreshToken) {
        Logger.info(`[GoogleAuth] Access token expired or expiring soon for user ${userId}. Refreshing...`);
        const refreshed = await GoogleApiService.refreshAccessToken(decryptedRefreshToken);
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            googleAccessToken: CryptoUtil.encrypt(refreshed.accessToken),
            googleTokenExpiry: refreshed.expiresAt,
          },
        });

        res.status(200).json(ResponseUtil.success('Google access token refreshed', { accessToken: refreshed.accessToken }));
        return;
      }

      res.status(200).json(ResponseUtil.success('Google access token retrieved', { accessToken: decryptedAccessToken }));
    } catch (error) {
      next(error);
    }
  }

  public static getGoogleAuthUrl(req: Request, res: Response, next: NextFunction): void {
    try {
      const clientId = envConfig.googleClientId;
      const clientSecret = envConfig.googleClientSecret;

      if (!clientId || !clientSecret) {
        throw new BadRequestError('Google credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) not configured on the backend.');
      }

      const sessionId = (req.headers['x-session-id'] as string) || 'default-guest-session-id';
      const csrf = crypto.randomBytes(16).toString('hex');
      const state = `${sessionId}:${csrf}`;

      if (req.session) {
        (req.session as any).oauthState = csrf;
      }

      const redirectUri = getCanonicalRedirectUri(req);
      Logger.info(`[Google OAuth] Redirect URI: ${redirectUri}`);

      const googleUrl = GoogleApiService.getAuthUrl(redirectUri, state);

      if (envConfig.isDevelopment) {
        Logger.info(`[Google OAuth] Generated redirect URL: ${googleUrl}`);
      }

      res.status(200).json(
        ResponseUtil.success('Google authorization URL generated', {
          url: googleUrl,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/google/callback
   * Processes code exchange and profile retrieval.
   */
  public static async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    const { code, state, error, error_description } = req.query;

    if (error) {
      Logger.error('Google OAuth callback returned error:', new Error(String(error_description || error)));
      res.send(
        GoogleAuthController.renderCallbackHTML({
          success: false,
          error: String(error_description || error),
        })
      );
      return;
    }

    if (!code) {
      res.status(400).send(
        GoogleAuthController.renderCallbackHTML({
          success: false,
          error: 'Authorization code was missing from Google callback query parameters.',
        })
      );
      return;
    }

    try {
      const redirectUri = getCanonicalRedirectUri(req);
      Logger.info(`[Google Callback] Using redirect URI: ${redirectUri}`);

      const stateParts = String(state).split(':');
      const sessionId = stateParts[0] || 'default-guest-session-id';

      const { defaultSessionStore } = await import('../session/session.store');
      const session = defaultSessionStore.get(sessionId) || req.session;

      // 1. Exchange code for credentials
      const tokens = await GoogleApiService.exchangeCodeForTokens(String(code), redirectUri);

      // 2. Fetch user profile info
      const profile = await GoogleApiService.fetchUserProfile(tokens.accessToken);

      // 3. Save connection details in session store
      if (session) {
        const encryptedAccessToken = CryptoUtil.encrypt(tokens.accessToken);
        const encryptedRefreshToken = CryptoUtil.encrypt(tokens.refreshToken) || null;

        session.tempGoogle = {
          email: profile.email,
          googleUserId: profile.id,
          googleAccessToken: encryptedAccessToken!,
          googleRefreshToken: encryptedRefreshToken,
          googleTokenExpiry: tokens.expiresAt,
        };
        session.googleConnected = true;
      }

      res.send(
        GoogleAuthController.renderCallbackHTML({
          success: true,
          email: profile.email,
        })
      );
    } catch (err: any) {
      Logger.error('Google token exchange failed:', err);
      res.status(500).send(
        GoogleAuthController.renderCallbackHTML({
          success: false,
          error: err.message || 'Google token exchange failed.',
        })
      );
    }
  }

  /**
   * POST /api/v1/google/folder
   * Saves the selected folder ID and name.
   */
  public static async saveDriveFolder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { folderId, folderName } = req.body;
      if (!folderId || !folderName) {
        throw new BadRequestError('folderId and folderName parameters are required.');
      }

      if (!req.session?.onboardingFinished) {
        if (req.session?.tempGoogle) {
          req.session.tempGoogle.folderId = folderId;
          req.session.tempGoogle.folderName = folderName;
          req.session.googleDriveConnected = true;
        }
        res.status(200).json(ResponseUtil.success('Google Drive sync folder configured in temporary session'));
        return;
      }

      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (prisma) {
        await prisma.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: 'guest-user@reelpilot.com',
            driveFolderId: folderId,
            driveFolderName: folderName,
          },
          update: {
            driveFolderId: folderId,
            driveFolderName: folderName,
          },
        });
        Logger.info(`[GoogleAuth] User ${userId} selected sync folder: ${folderName} (${folderId})`);
      }

      res.status(200).json(ResponseUtil.success('Google Drive sync folder configured successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/google/disconnect
   * Resets all Google columns.
   */
  public static async disconnectGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.session?.onboardingFinished) {
        if (req.session) {
          req.session.googleConnected = false;
          req.session.googleDriveConnected = false;
          req.session.tempGoogle = undefined;
        }
        res.status(200).json(ResponseUtil.success('Google Drive connection successfully revoked from temporary session'));
        return;
      }

      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (prisma) {
        await prisma.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: 'guest-user@reelpilot.com',
            googleConnected: false,
            googleDriveConnected: false,
          },
          update: {
            googleConnected: false,
            googleDriveConnected: false,
            googleEmail: null,
            googleUserId: null,
            googleAccessToken: null,
            googleRefreshToken: null,
            googleTokenExpiry: null,
            driveFolderId: null,
            driveFolderName: null,
          },
        });
        Logger.info(`[GoogleAuth] User ${userId} disconnected Google connection.`);
      }

      if (req.session) {
        req.session.googleConnected = false;
      }

      res.status(200).json(ResponseUtil.success('Google Drive connection successfully revoked'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renders callback page script to post message back to Settings window.
   */
  private static renderCallbackHTML(data: { success: boolean; email?: string; error?: string }): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Google Authentication Callback</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #09090b;
            color: #f4f4f5;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container {
            padding: 30px;
            border-radius: 16px;
            border: 1px solid #1f1f23;
            background-color: #111113;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          .icon {
            font-size: 40px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 10px 0;
          }
          p {
            font-size: 13px;
            color: #a1a1aa;
            margin: 0 0 20px 0;
            line-height: 1.5;
          }
          .error {
            color: #f87171;
            background-color: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.1);
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            font-family: monospace;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${
            data.success
              ? `
            <div class="icon" style="color: #3b82f6;">✓</div>
            <h1>Google Drive Connected!</h1>
            <p>Your Google profile <strong>${data.email}</strong> was successfully linked. You can close this window now.</p>
          `
              : `
            <div class="icon" style="color: #ef4444;">⚠</div>
            <h1>Connection Failed</h1>
            <p>Google connection failed. Review error details below:</p>
            <div class="error">${data.error}</div>
          `
          }
        </div>

        <script>
          const messageData = ${JSON.stringify(data)};
          if (window.opener) {
            if (messageData.success) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                email: messageData.email
              }, '*');
            } else {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_FAILED',
                error: messageData.error
              }, '*');
            }
            setTimeout(() => {
              window.close();
            }, 1500);
          } else {
            setTimeout(() => {
              window.location.href = '/#/settings';
            }, 2000);
          }
        </script>
      </body>
      </html>
    `;
  }
}
