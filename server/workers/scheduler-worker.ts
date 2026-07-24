import { getPrismaClient } from '../database/prisma';
import { Logger } from '../utils/logger.util';

const SCHEDULER_INTERVAL_MS = 60 * 1000; // Check every 1 minute

let schedulerIntervalHandle: NodeJS.Timeout | null = null;
let isProcessing = false;

export function startSchedulerWorker(): void {
  if (schedulerIntervalHandle) {
    Logger.warn('[SchedulerWorker] Scheduler worker is already running.');
    return;
  }

  Logger.info('[SchedulerWorker] Starting scheduler worker (1min interval)...');

  schedulerIntervalHandle = setInterval(() => {
    processScheduledJobs();
  }, SCHEDULER_INTERVAL_MS);
}

export function stopSchedulerWorker(): void {
  if (schedulerIntervalHandle) {
    clearInterval(schedulerIntervalHandle);
    schedulerIntervalHandle = null;
    Logger.info('[SchedulerWorker] Scheduler worker stopped.');
  }
}

export function isSchedulerWorkerRunning(): boolean {
  return schedulerIntervalHandle !== null;
}

async function processScheduledJobs(): Promise<void> {
  if (isProcessing) {
    Logger.warn('[SchedulerWorker] Previous batch still processing. Skipping.');
    return;
  }

  isProcessing = true;
  try {
    const { SchedulerService } = await import('../services/scheduler.service');
    await SchedulerService.processQueue();
  } catch (err: any) {
    Logger.error('[SchedulerWorker] Job processing error:', err);
  } finally {
    isProcessing = false;
  }
}
