import { createApp } from './server/app';
import { envConfig } from './server/config/env.config';
import { Logger } from './server/utils/logger.util';
import { startDriveSyncWorker } from './server/workers/sync-worker';
import { startSchedulerWorker } from './server/workers/scheduler-worker';

async function bootstrap() {
  try {
    const app = await createApp();
    const port = envConfig.port;

    app.listen(port, '0.0.0.0', () => {
      Logger.info(`✔ ReelPilot server initialized on port ${port}`);
      Logger.info(`ℹ Platform Access Point: http://localhost:${port}`);
      Logger.info(`ℹ Health Check Endpoint: http://localhost:${port}/api/v1/health`);

      // Start background workers after server is ready
      startDriveSyncWorker();
      startSchedulerWorker();
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      Logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
      const { stopDriveSyncWorker } = require('./server/workers/sync-worker');
      const { stopSchedulerWorker } = require('./server/workers/scheduler-worker');
      stopDriveSyncWorker();
      stopSchedulerWorker();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    Logger.error('Failed to start ReelPilot server:', error as Error);
    process.exit(1);
  }
}

bootstrap();
