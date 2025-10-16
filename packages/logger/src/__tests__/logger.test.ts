import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../logger.js';
import { LogLevel } from '../types.js';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should create a logger instance', () => {
    const logger = new Logger();
    expect(logger).toBeDefined();
  });

  it('should log info messages', () => {
    const logger = new Logger({ level: LogLevel.INFO });
    logger.info('test message', { key: 'value' });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log debug messages when level is DEBUG', () => {
    const logger = new Logger({ level: LogLevel.DEBUG });
    logger.debug('debug message');

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should not log debug messages when level is INFO', () => {
    const logger = new Logger({ level: LogLevel.INFO });
    logger.debug('debug message');

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    const logger = new Logger({ level: LogLevel.WARN });
    logger.warn('warning message');

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log error messages with error object', () => {
    const logger = new Logger({ level: LogLevel.ERROR });
    const error = new Error('test error');
    logger.error('error message', error);

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should create a child logger with additional context', () => {
    const logger = new Logger();
    const childLogger = logger.child({ service: 'TestService' });

    expect(childLogger).toBeDefined();
    childLogger.info('child message');

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should respect log level configuration', () => {
    const logger = new Logger({ level: LogLevel.ERROR });

    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');

    expect(consoleLogSpy).not.toHaveBeenCalled();

    logger.error('error');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should set log level dynamically', () => {
    const logger = new Logger({ level: LogLevel.ERROR });

    logger.info('info before');
    expect(consoleLogSpy).not.toHaveBeenCalled();

    logger.setLevel(LogLevel.INFO);
    logger.info('info after');

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should use pretty print in development', () => {
    const logger = new Logger({
      environment: 'development',
      prettyPrint: true,
    });

    logger.info('test message', { key: 'value' });

    expect(consoleLogSpy).toHaveBeenCalled();
    const loggedMessage = consoleLogSpy.mock.calls[0][0];
    expect(loggedMessage).toContain('[INFO]');
  });

  it('should use JSON format when prettyPrint is false', () => {
    const logger = new Logger({
      environment: 'production',
      prettyPrint: false,
    });

    logger.info('test message', { key: 'value' });

    expect(consoleLogSpy).toHaveBeenCalled();
    const loggedMessage = consoleLogSpy.mock.calls[0][0] as string;
    expect(() => JSON.parse(loggedMessage)).not.toThrow();
  });
});
