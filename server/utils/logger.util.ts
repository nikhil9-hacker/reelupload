import { envConfig } from '../config/env.config';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const timestamp = this.formatTimestamp();

    if (envConfig.isProduction) {
      // Production structured JSON logging
      const logObject: LogPayload = {
        timestamp,
        level,
        message,
        ...(context ? { context } : {}),
        ...(error ? { error: { message: error.message, stack: error.stack } as any } : {}),
      };
      console.log(JSON.stringify(logObject));
    } else {
      // Development human-readable logging
      const colorMap: Record<LogLevel, string> = {
        info: '\x1b[36m[INFO]\x1b[0m',
        warn: '\x1b[33m[WARN]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m',
        debug: '\x1b[35m[DEBUG]\x1b[0m',
      };

      const color = colorMap[level];
      const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
      console.log(`${color} [${timestamp}] ${message}${contextStr}`);

      if (error && error.stack) {
        console.error('\x1b[31m' + error.stack + '\x1b[0m');
      }
    }
  }

  public static info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  public static warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  public static error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  public static debug(message: string, context?: Record<string, unknown>): void {
    if (!envConfig.isProduction) {
      this.log('debug', message, context);
    }
  }
}
