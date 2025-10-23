/**
 * Simple browser logger utility
 * Wraps console for consistent logging in client code
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Browser logger utility for consistent logging across the client application.
 * Provides debug, info, warn, and error log levels with environment-aware debug logging.
 */
export const logger = {
  /**
   * Logs a debug message (only in development environment).
   * @param message - The debug message to log
   * @param args - Additional arguments to log
   */
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Logs an informational message.
   * @param message - The info message to log
   * @param args - Additional arguments to log
   */
  info: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${message}`, ...args);
  },

  /**
   * Logs a warning message.
   * @param message - The warning message to log
   * @param args - Additional arguments to log
   */
  warn: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Logs an error message.
   * @param message - The error message to log
   * @param args - Additional arguments to log
   */
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, ...args);
  }
};
