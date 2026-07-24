import { IDatabaseClient, QueryResult } from '../types/database.types';
import { Logger } from '../utils/logger.util';
import { getPrismaClient } from './prisma';

/**
 * Database client abstraction compatible with PostgreSQL & Prisma.
 */
export class DatabaseClientPlaceholder implements IDatabaseClient {
  private connected: boolean = false;

  public async connect(): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma) {
      Logger.warn('[Database] Skipping database connection setup (DATABASE_URL not configured).');
      this.connected = false;
      return;
    }

    try {
      await prisma.$connect();
      this.connected = true;
      Logger.info('[Database] PostgreSQL database connected via Prisma Client.');
    } catch (error) {
      Logger.error('[Database] Failed to connect to PostgreSQL database:', error as Error);
      this.connected = false;
    }
  }

  public async disconnect(): Promise<void> {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.$disconnect();
    }
    this.connected = false;
    Logger.info('[Database] Database client disconnected.');
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async query<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const prisma = getPrismaClient();
    if (!prisma) {
      Logger.warn('[Database] Executing query without configured DATABASE_URL.');
      return { rows: [] as T[], rowCount: 0 };
    }

    try {
      const result = await prisma.$queryRawUnsafe<T[]>(sql, ...params);
      return {
        rows: Array.isArray(result) ? result : [],
        rowCount: Array.isArray(result) ? result.length : 0,
      };
    } catch (error) {
      Logger.error('[Database Query Error]', error as Error, { sql });
      throw error;
    }
  }

  public async transaction<T>(callback: (client: IDatabaseClient) => Promise<T>): Promise<T> {
    Logger.debug('[Database Transaction] Executing transaction callback...');
    return callback(this);
  }
}

export const dbClient = new DatabaseClientPlaceholder();
