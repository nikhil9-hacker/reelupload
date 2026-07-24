import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util';

export class SettingsController {
  public static handleSettingsRoute(req: Request, res: Response, next: NextFunction): void {
    res.status(200).json(ResponseUtil.success('Settings API active', { status: 'ok' }));
  }
}
