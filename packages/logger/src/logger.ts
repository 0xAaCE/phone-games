import { ILogger, LogContext, LoggerConfig, LogLevel } from './types.js';

export class Logger implements ILogger {
  private level: LogLevel;
  private environment: string;
  private serviceName: string;
  private prettyPrint: boolean;
  private defaultContext: LogContext;

  constructor(config: LoggerConfig = {}, defaultContext: LogContext = {}) {
    this.level = config.level ?? this.getDefaultLogLevel();
    this.environment = config.environment ?? process.env.NODE_ENV ?? 'development';
    this.serviceName = config.serviceName ?? 'phone-games';
    this.prettyPrint = config.prettyPrint ?? this.environment === 'development';
    this.defaultContext = defaultContext;
  }

  private getDefaultLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'NONE':
        return LogLevel.NONE;
      default:
        return this.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  child(childContext: LogContext): ILogger {
    return new Logger(
      {
        level: this.level,
        environment: this.environment,
        serviceName: this.serviceName,
        prettyPrint: this.prettyPrint,
      },
      { ...this.defaultContext, ...childContext }
    );
  }

  debug(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.INFO) {
      this.log('INFO', message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.WARN) {
      this.log('WARN', message, context);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.level <= LogLevel.ERROR) {
      const errorContext = error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : {};
      this.log('ERROR', message, { ...errorContext, ...context });
    }
  }

  private log(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...this.defaultContext,
      ...context,
    };

    if (this.prettyPrint) {
      this.prettyLog(level, message, logEntry);
    } else {
      this.jsonLog(logEntry);
    }
  }

  private prettyLog(level: string, message: string, logEntry: Record<string, unknown>): void {
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = colors[level as keyof typeof colors] ?? '';

    const timestamp = logEntry.timestamp as string;
    const contextStr = Object.keys(logEntry)
      .filter(key => !['timestamp', 'level', 'service', 'environment', 'message'].includes(key))
      .map(key => `${key}=${JSON.stringify(logEntry[key])}`)
      .join(' ');

    const contextOutput = contextStr ? ` ${contextStr}` : '';
    console.log(
      `${color}[${timestamp}] [${level}] [${this.serviceName}]${reset} ${message}${contextOutput}`
    );
  }

  private jsonLog(logEntry: Record<string, unknown>): void {
    console.log(JSON.stringify(logEntry));
  }
}
