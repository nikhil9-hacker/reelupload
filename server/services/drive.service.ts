import { NotImplementedError } from '../utils/error.util';

export class GoogleDriveService {
  public async listFiles(): Promise<never> {
    throw new NotImplementedError('Google Drive service reserved for Phase 5');
  }

  public async syncFolder(): Promise<never> {
    throw new NotImplementedError('Google Drive folder sync reserved for Phase 5');
  }
}

export const googleDriveService = new GoogleDriveService();
