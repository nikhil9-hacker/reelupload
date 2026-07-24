import { IUserSession } from '../types/session.types';

export class SessionStore {
  private sessions: Map<string, IUserSession> = new Map();

  public get(sessionId: string): IUserSession | undefined {
    return this.sessions.get(sessionId);
  }

  public set(sessionId: string, session: IUserSession): void {
    this.sessions.set(sessionId, session);
  }

  public destroy(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  public clear(): void {
    this.sessions.clear();
  }
}

export const defaultSessionStore = new SessionStore();
