export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
}

export interface IDatabaseClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  transaction<T>(callback: (client: IDatabaseClient) => Promise<T>): Promise<T>;
  isConnected(): boolean;
}
