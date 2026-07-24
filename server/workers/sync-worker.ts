import { getPrismaClient } from '../database/prisma';
import { DriveSyncService } from '../services/drive-sync.service';
import { Logger } from '../utils/logger.util';

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

let syncIntervalHandle: NodeJS.Timeout | null = null;
let isRunning = false;

export function startDriveSyncWorker(): void {
  if (syncIntervalHandle) {
    Logger.warn('[SyncWorker] Drive sync worker is already running.');
    return;
  }

  Logger.info('[SyncWorker] Starting Drive sync background worker (15min interval)...');

  // Run immediately on boot
  runSync();

  syncIntervalHandle = setInterval(() => {
    runSync();
  }, SYNC_INTERVAL_MS);
}

export function stopDriveSyncWorker(): void {
  if (syncIntervalHandle) {
    clearInterval(syncIntervalHandle);
    syncIntervalHandle = null;
    Logger.info('[SyncWorker] Drive sync worker stopped.');
  }
}

export function isSyncWorkerRunning(): boolean {
  return syncIntervalHandle !== null;
}

export async function runSyncNow(userId?: string): Promise<{ synced: number; paired: number; unpaired: number; errors: string[] }> {
  if (userId) {
    return DriveSyncService.syncUserFolder(userId);
  }
  await DriveSyncService.syncAllUsers();
  return { synced: 0, paired: 0, unpaired: 0, errors: [] };
}

async function runSync(): Promise<void> {
  if (isRunning) {
    Logger.warn('[SyncWorker] Previous sync still running. Skipping this cycle.');
    return;
  }

  isRunning = true;
  try {
    Logger.info('[SyncWorker] Running scheduled Drive sync cycle...');
    await DriveSyncService.syncAllUsers();
    Logger.info('[SyncWorker] Drive sync cycle completed.');
  } catch (err: any) {
    Logger.error('[SyncWorker] Drive sync cycle failed:', err);
  } finally {
    isRunning = false;
  }
}
