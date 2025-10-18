import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../src/logger.js';
import { LogLevel } from '../src/types.js';
import pino from 'pino';

describe('Logger', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stdoutWriteSpy: any;

  beforeEach(() => {
    // Spy on stdout.write instead of console.log since Pino writes directly to stdout
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutWriteSpy.mockRestore();
  });

  it('should create a logger instance', () => {
    const logger = new Logger();
    expect(logger).toBeDefined();
  });

  it('should log info messages', () => {
    const logger = new Logger({ level: LogLevel.INFO, prettyPrint: false });
    logger.info('test message', { key: 'value' });

    expect(stdoutWriteSpy).toHaveBeenCalled();
    const logOutput = stdoutWriteSpy.mock.calls[0][0] as string;
    const logEntry = JSON.parse(logOutput);
    expect(logEntry.msg).toBe('test message');
    expect(logEntry.key).toBe('value');
  });

  it('should log debug messages when level is DEBUG', () => {
    const logger = new Logger({ level: LogLevel.DEBUG, prettyPrint: false });
    logger.debug('debug message');

    expect(stdoutWriteSpy).toHaveBeenCalled();
    const logOutput = stdoutWriteSpy.mock.calls[0][0] as string;
    const logEntry = JSON.parse(logOutput);
    expect(logEntry.msg).toBe('debug message');
    expect(logEntry.level).toBe(20); // Pino debug level
  });

  it('should not log debug messages when level is INFO', () => {
    const logger = new Logger({ level: LogLevel.INFO, prettyPrint: false });
    logger.debug('debug message');

    expect(stdoutWriteSpy).not.toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    const logger = new Logger({ level: LogLevel.WARN, prettyPrint: false });
    logger.warn('warning message');

    expect(stdoutWriteSpy).toHaveBeenCalled();
    const logOutput = stdoutWriteSpy.mock.calls[0][0] as string;
    const logEntry = JSON.parse(logOutput);
    expect(logEntry.msg).toBe('warning message');
    expect(logEntry.level).toBe(40); // Pino warn level
  });

  it('should log error messages with error object', () => {
    const logger = new Logger({ level: LogLevel.ERROR, prettyPrint: false });
    const error = new Error('test error');
    logger.error('error message', error);

    expect(stdoutWriteSpy).toHaveBeenCalled();
    const logOutput = stdoutWriteSpy.mock.calls[0][0] as string;
    const logEntry = JSON.parse(logOutput);
    expect(logEntry.msg).toBe('error message');
    expect(logEntry.err).toBeDefined();
    expect(logEntry.err.message).toBe('test error');
  });

  it('should create a child logger with additional context', () => {
    const logger = new Logger({ prettyPrint: false });
    const childLogger = logger.child({ service: 'TestService' });

    expect(childLogger).toBeDefined();
    childLogger.info('child message');

    expect(stdoutWriteSpy).toHaveBeenCalled();
    const logOutput = stdoutWriteSpy.mock.calls[0][0] as string;
    const logEntry = JSON.parse(logOutput);
    expect(logEntry.msg).toBe('child message');
    expect(logEntry.service).toBe('TestService');
  });

  it('should respect log level configuration', () => {
    const logger = new Logger({ level: LogLevel.ERROR, prettyPrint: false });

    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');

    expect(stdoutWriteSpy).not.toHaveBeenCalled();

    logger.error('error');
    expect(stdoutWriteSpy).toHaveBeenCalled();
  });

  it('should set log level dynamically', () => {
    const logger = new Logger({ level: LogLevel.ERROR, prettyPrint: false });

    logger.info('info before');
    expect(stdoutWriteSpy).not.toHaveBeenCalled();

    logger.setLevel(LogLevel.INFO);
    logger.info('info after');

    expect(stdoutWriteSpy).toHaveBeenCalled();
  });

  it('should support pretty print mode', () => {
    // Pretty print uses pino-pretty in a worker thread, so it's harder to test
    // Just verify it creates successfully with prettyPrint enabled
    const logger = new Logger({
      environment: 'development',
      prettyPrint: true,
    });

    expect(logger).toBeDefined();
    // Log output will be formatted by pino-pretty, but testing worker thread output is complex
  });

  it('should use JSON format when prettyPrint is false', () => {
    const logger = new Logger({
      environment: 'production',
      prettyPrint: false,
    });

    logger.info('test message', { key: 'value' });

    expect(stdoutWriteSpy).toHaveBeenCalled();
    const logOutput = stdoutWriteSpy.mock.calls[0][0] as string;
    expect(() => JSON.parse(logOutput)).not.toThrow();
    const logEntry = JSON.parse(logOutput);
    expect(logEntry.msg).toBe('test message');
    expect(logEntry.key).toBe('value');
  });
});
