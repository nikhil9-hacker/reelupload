import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util';
import { envConfig } from '../config/env.config';
import { APP_METADATA } from '../config/app.config';
import { getPrismaClient } from '../database/prisma';

const serverStartTime = Date.now();

export class HealthController {
  public static async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
      let databaseStatus = 'Not Configured';

      const prisma = getPrismaClient();
      if (prisma) {
        try {
          await prisma.$queryRaw`SELECT 1`;
          databaseStatus = 'Connected';
        } catch (dbErr) {
          databaseStatus = 'Error';
        }
      }

      res.status(200).json(
        ResponseUtil.success('Application health check successful', {
          apiVersion: APP_METADATA.apiVersion,
          environment: envConfig.nodeEnv,
          serverTime: new Date().toISOString(),
          status: databaseStatus === 'Error' ? 'degraded' : 'healthy',
          uptimeSeconds,
          database: databaseStatus,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
