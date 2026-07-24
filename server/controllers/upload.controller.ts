import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util';

export class UploadController {
  public static handleUploadRoute(req: Request, res: Response, next: NextFunction): void {
    res.status(200).json(ResponseUtil.success('Upload API active', { status: 'ok' }));
  }
}
