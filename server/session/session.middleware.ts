import { Request, Response, NextFunction } from 'express';
import { IUserSession } from '../types/session.types';
import { defaultSessionStore } from './session.store';

/**
 * Server-side session middleware.
 * Attaches a typed session object storing:
 * - User ID
 * - Instagram Connected
 * - Google Drive Connected
 * - Workspace ID
 * - Session Created Time
 * No authentication yet.
 */
export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sessionIdHeader = req.headers['x-session-id'] as string;
  const sessionId = sessionIdHeader || 'default-guest-session-id';

  let existingSession = defaultSessionStore.get(sessionId);

  if (!existingSession) {
    existingSession = {
      userId: 'guest-user-001',
      instagramConnected: false,
      googleDriveConnected: false,
      googleConnected: false,
      workspaceId: 'workspace-default-001',
      sessionCreatedTime: Date.now(),
    };
    defaultSessionStore.set(sessionId, existingSession);
  }

  req.session = existingSession;
  res.setHeader('X-Session-ID', sessionId);

  next();
}
