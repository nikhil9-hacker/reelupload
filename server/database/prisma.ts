import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger.util';

declare global {
  // eslint-disable-next-line no-var
  var prismaClientInstance: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.trim() === '') {
    Logger.warn('[Database] DATABASE_URL is missing. Skipping Prisma initialization.');
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient();
  }

  if (!globalThis.prismaClientInstance) {
    globalThis.prismaClientInstance = new PrismaClient();
  }

  return globalThis.prismaClientInstance;
}

export const prisma = getPrismaClient();
