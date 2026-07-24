import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger.util';
import { BadRequestError, InternalServerError } from '../utils/error.util';

export interface MetaTokenExchangeResult {
  shortLivedToken: string;
}

export interface MetaLongLivedTokenResult {
  accessToken: string;
  expiresInSeconds: number;
}

export interface InstagramBusinessProfile {
  id: string;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
  facebookPageId: string;
  facebookPageName: string;
  longLivedToken: string;
  expiresAt: Date;
}

export class MetaApiService {
  private static readonly INSTAGRAM_API_BASE_URL = 'https://api.instagram.com';
  private static readonly INSTAGRAM_GRAPH_BASE_URL = 'https://graph.instagram.com';

  /**
   * Generates authorization URL pointing to Instagram direct Login OAuth endpoint (Buffer style).
   */
  public static getAuthorizationUrl(redirectUri: string, state: string): string {
    const appId = envConfig.metaAppId;
    if (!appId) {
      throw new BadRequestError('Server is missing META_APP_ID environment configuration.');
    }

    const scopes = [
      'instagram_business_basic',
      'instagram_business_content_publish',
    ].join(',');

    return `${this.INSTAGRAM_API_BASE_URL}/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes}&state=${encodeURIComponent(state)}&response_type=code`;
  }

  /**
   * Exchanges authorization code for Short-Lived Access Token.
   */
  public static async exchangeCodeForToken(code: string, redirectUri: string): Promise<MetaTokenExchangeResult> {
    const appId = envConfig.metaAppId;
    const appSecret = envConfig.metaAppSecret;

    if (!appId || !appSecret) {
      throw new InternalServerError('Server is missing META_APP_ID or META_APP_SECRET credentials.');
    }

    const url = `${this.INSTAGRAM_API_BASE_URL}/oauth/access_token`;

    const formData = new URLSearchParams();
    formData.append('client_id', appId);
    formData.append('client_secret', appSecret);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      Logger.error('[Instagram Business API] Short-lived token exchange failed:', data.error);
      throw new BadRequestError(
        data.error?.message || 'Instagram code exchange failed. Code may be expired or invalid.'
      );
    }

    return { shortLivedToken: data.access_token };
  }

  /**
   * Exchanges Short-Lived Access Token for 60-Day Long-Lived Token.
   */
  public static async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaLongLivedTokenResult> {
    const appSecret = envConfig.metaAppSecret;
    if (!appSecret) {
      throw new InternalServerError('Server is missing META_APP_SECRET credentials.');
    }

    const url = `${this.INSTAGRAM_GRAPH_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`;

    const res = await fetch(url);
    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      Logger.error('[Instagram Business API] Failed long-lived token exchange:', data.error);
      throw new BadRequestError(data.error?.message || 'Instagram long-lived token exchange failed.');
    }

    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 5184000, // 60 days default
    };
  }
  /**
   * Refreshes a long-lived access token before it expires.
   */
  public static async refreshLongLivedToken(longLivedToken: string): Promise<MetaLongLivedTokenResult> {
    const url = `${this.INSTAGRAM_GRAPH_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedToken}`;

    const res = await fetch(url);
    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      Logger.error('[Instagram Business API] Failed refreshing long-lived token:', data.error);
      throw new BadRequestError(data.error?.message || 'Instagram token refresh failed.');
    }

    return {
      accessToken: data.access_token,
      expiresInSeconds: data.expires_in || 5184000,
    };
  }
  /**
   * Resolves Instagram Business profile directly using the Instagram Graph API.
   * Removes every dependency on Facebook Pages, page lookup, and account resolution.
   */
  public static async resolveInstagramBusinessAccount(
    shortLivedToken: string
  ): Promise<InstagramBusinessProfile> {
    // 1. Exchange for long-lived access token
    const longLived = await this.exchangeForLongLivedToken(shortLivedToken);
    const expiresAt = new Date(Date.now() + longLived.expiresInSeconds * 1000);

    // 2. Query profile details directly from Instagram Graph
    const url = `${this.INSTAGRAM_GRAPH_BASE_URL}/v20.0/me?fields=id,username,name,profile_picture_url&access_token=${longLived.accessToken}`;

    const res = await fetch(url);
    const data = (await res.json()) as any;

    if (!res.ok || data.error) {
      Logger.error('[Instagram Business API] Failed fetching profile details:', data.error);
      throw new BadRequestError(data.error?.message || 'Failed fetching Instagram profile details.');
    }

    return {
      id: data.id,
      username: data.username,
      fullName: data.name || data.username,
      profilePictureUrl: data.profile_picture_url,
      facebookPageId: 'N/A',
      facebookPageName: 'Instagram Business Flow (Buffer Style)',
      longLivedToken: longLived.accessToken,
      expiresAt,
    };
  }
}
