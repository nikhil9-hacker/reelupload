export type NodeEnv = 'development' | 'production' | 'test';

export interface HealthStatus {
  apiVersion: string;
  environment: NodeEnv;
  serverTime: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  database: string;
}
