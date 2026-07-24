import { IUserSession } from './session.types';

declare global {
  namespace Express {
    interface Request {
      session?: IUserSession;
      requestId?: string;
    }
  }
}
