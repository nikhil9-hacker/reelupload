import { ApiResponse } from '../types/api.types';

export class ResponseUtil {
  public static success<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      ...(data !== undefined ? { data } : {}),
      timestamp: new Date().toISOString(),
    };
  }

  public static error(
    message: string,
    errorCode: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown> | string[]
  ): ApiResponse<never> {
    return {
      success: false,
      message,
      error: {
        code: errorCode,
        ...(details ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
