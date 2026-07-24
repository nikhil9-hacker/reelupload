import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger.util';
import { BadRequestError, InternalServerError } from '../utils/error.util';

export interface GoogleTokensResult {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds: number;
  expiresAt: Date;
}

export interface GoogleUserProfile {
  id: string;
  email: string;
}

export class GoogleApiService {
  private static readonly OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private static readonly USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

  /**
   * Generates Google OAuth Consent Dialog URL requesting offline read-only drive access.
   */
  public static getAuthUrl(redirectUri: string, state: string): string {
    const clientId = envConfig.googleClientId;
    if (!clientId) {
      throw new BadRequestError('Server is missing GOOGLE_CLIENT_ID configuration.');
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ].join(' ');

    return `${this.OAUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(
      scopes
    )}&state=${encodeURIComponent(
      state
    )}&response_type=code&access_type=offline&prompt=consent`;
  }

  /**
   * Exchanges authorization code for access and refresh tokens.
   */
  public static async exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokensResult> {
    const clientId = envConfig.googleClientId;
    const clientSecret = envConfig.googleClientSecret;

    if (!clientId || !clientSecret) {
      throw new InternalServerError('Server is missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
    }

    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const res = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      Logger.error('[Google API] Token exchange failed:', data);
      throw new BadRequestError(data.error_description || data.error || 'Google token exchange failed.');
    }

    const expiresIn = data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresInSeconds: expiresIn,
      expiresAt,
    };
  }

  /**
   * Refreshes access token using long-lived refresh token.
   */
  public static async refreshAccessToken(refreshToken: string): Promise<GoogleTokensResult> {
    const clientId = envConfig.googleClientId;
    const clientSecret = envConfig.googleClientSecret;

    if (!clientId || !clientSecret) {
      throw new InternalServerError('Server is missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      Logger.error('[Google API] Token refresh failed:', data);
      throw new BadRequestError(data.error_description || data.error || 'Google token refresh failed.');
    }

    const expiresIn = data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: data.access_token,
      expiresInSeconds: expiresIn,
      expiresAt,
    };
  }

  /**
   * Fetches user profile information (email & unique Google ID).
   */
  public static async fetchUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    const res = await fetch(this.USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      Logger.error('[Google API] Fetching profile failed:', data.error);
      throw new BadRequestError(data.error?.message || 'Failed fetching Google user profile.');
    }

    return {
      id: data.id,
      email: data.email,
    };
  }
}
