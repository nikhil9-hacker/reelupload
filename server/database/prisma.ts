import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger.util';

declare global {
  // eslint-disable-next-line no-var
  var prismaClientInstance: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.trim() === '' || (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))) {
    Logger.warn('[Database] DATABASE_URL is missing or invalid postgresql URL. Skipping Prisma initialization.');
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    if (!globalThis.prismaClientInstance) {
      globalThis.prismaClientInstance = new PrismaClient();
    }
    return globalThis.prismaClientInstance;
  }

  if (!globalThis.prismaClientInstance) {
    globalThis.prismaClientInstance = new PrismaClient();
  }

  return globalThis.prismaClientInstance;
}

export const prisma = getPrismaClient();
