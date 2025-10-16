import { BaseError } from './baseError.js';

/**
 * Type guard to check if an error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Type guard to check if an error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (isBaseError(error)) {
    return error.isOperational;
  }
  return false;
}

/**
 * Extract HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isBaseError(error)) {
    return error.statusCode;
  }
  return 500; // Default to internal server error
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  if (isBaseError(error)) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    error: String(error),
  };
}

/**
 * Format error for client response (hides sensitive info)
 */
export function formatErrorForClient(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
} {
  if (isBaseError(error)) {
    return {
      message: error.isOperational ? error.message : 'An unexpected error occurred',
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
}
