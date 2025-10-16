export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  setLevel(level: LogLevel): void;
  child(defaultContext: LogContext): ILogger;
}

export interface LoggerConfig {
  level?: LogLevel;
  environment?: string;
  serviceName?: string;
  prettyPrint?: boolean;
}
