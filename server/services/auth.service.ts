import { NotImplementedError } from '../utils/error.util';

export class AuthService {
  public async getAuthUrl(): Promise<never> {
    throw new NotImplementedError('Auth service integration reserved for Phase 5');
  }

  public async handleCallback(): Promise<never> {
    throw new NotImplementedError('Auth callback reserved for Phase 5');
  }
}

export const authService = new AuthService();
