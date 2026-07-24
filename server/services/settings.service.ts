import { NotImplementedError } from '../utils/error.util';

export class SettingsService {
  public async getSettings(): Promise<never> {
    throw new NotImplementedError('Settings service reserved for Phase 5');
  }

  public async updateSettings(): Promise<never> {
    throw new NotImplementedError('Settings updates reserved for Phase 5');
  }
}

export const settingsService = new SettingsService();
