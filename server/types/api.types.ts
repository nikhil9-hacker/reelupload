export interface ApiErrorDetail {
  code: string;
  details?: Record<string, unknown> | string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiErrorDetail;
  timestamp: string;
}
