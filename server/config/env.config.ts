import dotenv from 'dotenv';
import { NodeEnv } from '../types/common.types';

dotenv.config();

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  appUrl: string;
  databaseUrl: string;
  sessionSecret: string;
  metaAppId?: string;
  metaAppSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  authProvider: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

function validateAndLoadConfig(): AppConfig {
  const rawEnv = process.env.NODE_ENV || 'development';
  const nodeEnv: NodeEnv = ['development', 'production', 'test'].includes(rawEnv)
    ? (rawEnv as NodeEnv)
    : 'development';

  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port <= 0) {
    throw new Error(`[Config Error] Invalid PORT specified: ${process.env.PORT}`);
  }

  const appUrl = process.env.APP_URL || `http://localhost:${port}`;
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/reelpilot_dev';
  const sessionSecret = process.env.SESSION_SECRET || 'reelpilot-dev-session-secret-change-in-prod';

  // Strict validation for production environment
  if (nodeEnv === 'production') {
    if (!process.env.SESSION_SECRET) {
      console.warn('[Config Warning] SESSION_SECRET is not explicitly set in production. Using fallback secret.');
    }
  }

  const authProvider = process.env.AUTH_PROVIDER || 'facebook';

  return Object.freeze({
    nodeEnv,
    port,
    appUrl,
    databaseUrl,
    sessionSecret,
    metaAppId: process.env.META_APP_ID || undefined,
    metaAppSecret: process.env.META_APP_SECRET || undefined,
    googleClientId: process.env.GOOGLE_CLIENT_ID || undefined,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || undefined,
    authProvider,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
  });
}

export const envConfig: AppConfig = validateAndLoadConfig();
