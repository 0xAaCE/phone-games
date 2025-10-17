import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';
import { ILogger, LogContext, LoggerConfig, LogLevel } from './types.js';

export class Logger implements ILogger {
  private pinoLogger: PinoLogger;
  private level: LogLevel;
  private defaultContext: LogContext;

  constructor(config: LoggerConfig = {}, defaultContext: LogContext = {}) {
    this.level = config.level ?? this.getDefaultLogLevel();
    const environment = config.environment ?? process.env.NODE_ENV ?? 'development';
    const serviceName = config.serviceName ?? 'phone-games';
    const prettyPrint = config.prettyPrint ?? environment === 'development';
    this.defaultContext = defaultContext;

    // Create Pino logger with appropriate configuration
    this.pinoLogger = pino({
      level: this.logLevelToPinoLevel(this.level),
      base: {
        service: serviceName,
        environment,
      },
      ...(prettyPrint && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
    });

    // Add default context as bindings
    if (Object.keys(this.defaultContext).length > 0) {
      this.pinoLogger = this.pinoLogger.child(this.defaultContext);
    }
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
        return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private logLevelToPinoLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.NONE:
        return 'silent';
      default:
        return 'info';
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
    this.pinoLogger.level = this.logLevelToPinoLevel(level);
  }

  child(childContext: LogContext): ILogger {
    const childLogger = new Logger();
    childLogger.pinoLogger = this.pinoLogger.child(childContext);
    childLogger.level = this.level;
    childLogger.defaultContext = { ...this.defaultContext, ...childContext };
    return childLogger;
  }

  debug(message: string, context?: LogContext): void {
    this.pinoLogger.debug(context ?? {}, message);
  }

  info(message: string, context?: LogContext): void {
    this.pinoLogger.info(context ?? {}, message);
  }

  warn(message: string, context?: LogContext): void {
    this.pinoLogger.warn(context ?? {}, message);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (error) {
      this.pinoLogger.error(
        {
          err: error,
          ...context,
        },
        message
      );
    } else {
      this.pinoLogger.error(context ?? {}, message);
    }
  }
}
