import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { envConfig } from '../config/env.config';
import { MetaApiService } from '../services/meta.service';
import { instagramService } from '../services/instagram.service';
import { getPrismaClient } from '../database/prisma';
import { CryptoUtil } from '../utils/crypto.util';
import { ResponseUtil } from '../utils/response.util';
import { BadRequestError } from '../utils/error.util';
import { Logger } from '../utils/logger.util';

/**
 * Deterministically constructs the canonical redirect URI for OAuth flows.
 * Ensures Step 1 (OAuth authorization dialog) and Step 2 (token exchange callback)
 * produce 100% character-for-character identical redirect_uri strings.
 */
function getCanonicalRedirectUri(req: Request): string {
  const callbackPath = '/api/v1/auth/instagram/callback';

  // 1. If process.env.APP_URL is explicitly set in production, use it
  if (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) {
    const cleanUrl = process.env.APP_URL.trim().replace(/\/$/, '').replace(/^http:\/\//, 'https://');
    return `${cleanUrl}${callbackPath}`;
  }

  // 2. Determine host from request headers
  const host = req.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  if (!isLocal) {
    const cleanHost = host.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${cleanHost}${callbackPath}`;
  }

  // 3. Fallback for local development
  const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol;
  return `${proto}://${host}${callbackPath}`;
}

export class AuthController {
  /**
   * GET /api/v1/auth/instagram/status
   * Returns current Instagram link status, username, and account name.
   */
  public static async getInstagramStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.session?.onboardingFinished) {
        const temp = req.session?.tempInstagram;
        res.status(200).json(
          ResponseUtil.success('Instagram connection status retrieved from temporary session', {
            instagramConnected: !!temp,
            username: temp?.username || null,
            accountName: temp?.fullName || null,
          })
        );
        return;
      }

      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      let instagramConnected = false;
      let username: string | null = null;
      let accountName: string | null = null;

      if (prisma) {
        // Automatically check and refresh token before retrieving status variables
        await instagramService.getAndRefreshActiveToken(userId);

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (user) {
          instagramConnected = user.instagramConnected;
          username = user.instagramUsername;
          accountName = user.name || user.instagramUsername;
        }
      }

      res.status(200).json(
        ResponseUtil.success('Instagram connection status retrieved', {
          instagramConnected,
          username,
          accountName,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/instagram
   * Generates secure authorization URL with CSRF state token.
   */
  public static getInstagramAuthUrl(req: Request, res: Response, next: NextFunction): void {
    try {
      const appId = envConfig.metaAppId;
      if (!appId) {
        // Return sandbox indicator if Meta credentials are not configured in environment
        res.status(200).json(ResponseUtil.success('Meta credentials not configured', { isSandbox: true }));
        return;
      }

      const sessionId = (req.headers['x-session-id'] as string) || 'default-guest-session-id';
      const csrf = crypto.randomBytes(16).toString('hex');
      const state = `${sessionId}:${csrf}`;

      if (req.session) {
        (req.session as any).oauthState = csrf;
      }

      const redirectUri = getCanonicalRedirectUri(req);

      const authUrl = MetaApiService.getAuthorizationUrl(redirectUri, state);

      if (envConfig.isDevelopment) {
        Logger.info('[Instagram OAuth] Generated authorization URL:');
        Logger.info(`  URL: ${authUrl}`);
        Logger.info(`  Redirect URI (must match Meta App settings): ${redirectUri}`);
        Logger.info(`  App ID: ${appId}`);
      }

      res.status(200).json(
        ResponseUtil.success('Authorization URL generated', {
          isSandbox: false,
          url: authUrl,
          redirectUri,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/instagram/callback
   * Handles callback from Meta OAuth, performs code exchange & account resolution.
   */
  public static async handleInstagramCallback(req: Request, res: Response): Promise<void> {
    const { code, state, error, error_description } = req.query;

    if (error) {
      Logger.error('Meta OAuth callback returned error:', new Error(String(error_description || error)));
      res.send(
        AuthController.renderCallbackHTML({
          success: false,
          error: String(error_description || error),
        })
      );
      return;
    }

    if (!code) {
      res.status(400).send(
        AuthController.renderCallbackHTML({
          success: false,
          error: 'Authorization code was missing from callback query parameters.',
        })
      );
      return;
    }

    try {
      const cleanCode = String(code).replace(/#_$/, '').replace(/#$/, '').trim();
      const redirectUri = getCanonicalRedirectUri(req);
      Logger.info(`[Instagram Callback] Using redirect URI: ${redirectUri}`);

      const stateParts = String(state).split(':');
      const sessionId = stateParts[0] || 'default-guest-session-id';

      const { defaultSessionStore } = await import('../session/session.store');
      const session = defaultSessionStore.get(sessionId) || req.session;

      // 1. Exchange code for Short-Lived Access Token
      const { shortLivedToken } = await MetaApiService.exchangeCodeForToken(cleanCode, redirectUri);

      // 2. Resolve Instagram Business Account directly
      const profile = await MetaApiService.resolveInstagramBusinessAccount(shortLivedToken);

      // 3. Save connection details securely in temporary session storage
      if (session) {
        session.tempInstagram = profile;
        session.instagramConnected = true;
      }

      // 4. Return self-closing HTML template
      res.send(
        AuthController.renderCallbackHTML({
          success: true,
          account: {
            id: profile.id,
            username: profile.username,
            fullName: profile.fullName,
            profilePictureUrl: profile.profilePictureUrl,
            facebookPage: profile.facebookPageName,
            isConnected: true,
            connectedAt: profile.expiresAt.toISOString(),
          },
        })
      );
    } catch (err: any) {
      Logger.error('Meta Token Exchange Pipeline error:', err);
      res.status(500).send(
        AuthController.renderCallbackHTML({
          success: false,
          error: err.message || 'Meta token exchange pipeline failed.',
        })
      );
    }
  }

  /**
   * POST /api/v1/auth/instagram/disconnect
   * Revokes token and updates user connection status.
   */
  public static async disconnectInstagram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.session?.onboardingFinished) {
        if (req.session) {
          req.session.instagramConnected = false;
          req.session.tempInstagram = undefined;
        }
        res.status(200).json(ResponseUtil.success('Instagram channel disconnected from temporary session'));
        return;
      }

      const userId = req.session?.userId || 'guest-user-001';
      await instagramService.disconnectInstagramConnection(userId);

      if (req.session) {
        req.session.instagramConnected = false;
      }

      res.status(200).json(ResponseUtil.success('Instagram channel disconnected successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renders self-closing HTML popup callback page.
   */
  private static renderCallbackHTML(data: { success: boolean; account?: any; error?: string }): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Linking Account Status</title>
        <style>
          body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 30px;
            background-color: #18181b;
            border-radius: 12px;
            border: 1px solid #27272a;
            max-width: 400px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 20px;
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
            <div class="icon" style="color: #10b981;">✓</div>
            <h1>Linked Successfully!</h1>
            <p>Your Instagram Channel <strong>@${data.account?.username}</strong> was successfully authorized. You can close this window now.</p>
          `
              : `
            <div class="icon" style="color: #ef4444;">⚠</div>
            <h1>Connection Failed</h1>
            <p>Meta accounts verification was unsuccessful. Review error details below:</p>
            <div class="error">${data.error}</div>
          `
          }
        </div>

        <script>
          const messageData = ${JSON.stringify(data)};

          // Signal the parent window via localStorage (works even when window.opener is cleared by Instagram)
          try {
            localStorage.setItem('reelpilot_oauth_result', JSON.stringify({
              type: messageData.success ? 'INSTAGRAM_CONNECTED' : 'INSTAGRAM_FAILED',
              success: messageData.success,
              account: messageData.account || null,
              error: messageData.error || null,
              ts: Date.now()
            }));
          } catch(e) {}

          // Also try postMessage if opener is still available
          if (window.opener && !window.opener.closed) {
            try {
              if (messageData.success) {
                window.opener.postMessage({ type: 'INSTAGRAM_CONNECTED', success: true, account: messageData.account }, '*');
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', account: messageData.account }, '*');
              } else {
                window.opener.postMessage({ type: 'INSTAGRAM_CONNECTED', success: false, error: messageData.error }, '*');
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILED', error: messageData.error }, '*');
              }
            } catch(e) {}
          }

          // Always close this popup after a short delay (do NOT redirect — that causes the setup loop)
          setTimeout(function() {
            window.close();
            // If window.close() didn't work (e.g. tab opened directly), show a manual close message
            setTimeout(function() {
              if (!window.closed) {
                document.body.innerHTML += '<p style="text-align:center;color:#888;margin-top:20px;font-size:13px">You can close this window now.</p>';
              }
            }, 500);
          }, 1500);
        </script>
      </body>
      </html>
    `;
  }

  /**
   * POST /api/v1/auth/onboarding/finish
   * Persists connected Instagram and Google channels in database.
   */
  public static async finishOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.session?.userId || 'guest-user-001';
      const prisma = getPrismaClient();

      if (!prisma) {
        throw new BadRequestError('Database connection is not configured.');
      }

      const tempIg = req.session?.tempInstagram;
      const tempGoogle = req.session?.tempGoogle;

      if (!tempIg) {
        throw new BadRequestError('Instagram setup has not been finished.');
      }

      if (!tempGoogle || !tempGoogle.folderId) {
        throw new BadRequestError('Google Drive folder setup has not been finished.');
      }

      // 1. Encrypt and save Instagram & Google credentials in a single Prisma transaction or upsert
      const encryptedIgToken = CryptoUtil.encrypt(tempIg.longLivedToken);
      const encryptedGoogleAccess = CryptoUtil.encrypt(tempGoogle.googleAccessToken);
      const encryptedGoogleRefresh = CryptoUtil.encrypt(tempGoogle.googleRefreshToken) || null;

      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: 'guest-user@reelpilot.com',
          name: 'ReelPilot Onboarded Creator',
          instagramConnected: true,
          instagramUserId: tempIg.id,
          instagramUsername: tempIg.username,
          facebookPageId: tempIg.facebookPageId,
          facebookPageName: tempIg.facebookPageName,
          accessToken: encryptedIgToken,
          tokenExpiry: tempIg.expiresAt,
          connectedAt: new Date(),
          googleConnected: true,
          googleDriveConnected: true,
          googleEmail: tempGoogle.email,
          googleUserId: tempGoogle.googleUserId,
          googleAccessToken: encryptedGoogleAccess,
          googleRefreshToken: encryptedGoogleRefresh,
          googleTokenExpiry: tempGoogle.googleTokenExpiry,
          driveFolderId: tempGoogle.folderId,
          driveFolderName: tempGoogle.folderName,
        },
        update: {
          instagramConnected: true,
          instagramUserId: tempIg.id,
          instagramUsername: tempIg.username,
          facebookPageId: tempIg.facebookPageId,
          facebookPageName: tempIg.facebookPageName,
          accessToken: encryptedIgToken,
          tokenExpiry: tempIg.expiresAt,
          connectedAt: new Date(),
          googleConnected: true,
          googleDriveConnected: true,
          googleEmail: tempGoogle.email,
          googleUserId: tempGoogle.googleUserId,
          googleAccessToken: encryptedGoogleAccess,
          googleRefreshToken: encryptedGoogleRefresh,
          googleTokenExpiry: tempGoogle.googleTokenExpiry,
          driveFolderId: tempGoogle.folderId,
          driveFolderName: tempGoogle.folderName,
        },
      });

      // 2. Mark session as onboarding finished and clear temp fields
      if (req.session) {
        req.session.onboardingFinished = true;
        req.session.tempInstagram = undefined;
        req.session.tempGoogle = undefined;
      }

      Logger.info(`[Onboarding] Successfully finalized setup database record for user ${userId}.`);
      res.status(200).json(ResponseUtil.success('Onboarding setup completed successfully'));
    } catch (error) {
      next(error);
    }
  }
}
