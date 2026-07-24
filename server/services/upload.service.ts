import { NotImplementedError } from '../utils/error.util';

export class UploadService {
  public async processUpload(): Promise<never> {
    throw new NotImplementedError('Upload worker processing reserved for Phase 5');
  }

  public async getUploadStatus(): Promise<never> {
    throw new NotImplementedError('Upload status tracking reserved for Phase 5');
  }
}

export const uploadService = new UploadService();
