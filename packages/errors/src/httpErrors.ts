import { BaseError } from './baseError.js';

/**
 * 400 Bad Request - Client sent invalid data
 * Display message: Uses provided message (validation messages are already user-friendly)
 */
export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      // Validation messages are typically user-friendly, so use the message itself
      displayMessage: options?.displayMessage || message,
    });
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 * Default display message: "Authentication required"
 */
export class UnauthorizedError extends BaseError {
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'Authentication required',
    });
  }
}

/**
 * 403 Forbidden - User doesn't have permission
 * Default display message: "You don't have permission"
 */
export class ForbiddenError extends BaseError {
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || "You don't have permission",
    });
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 * Display message: Uses provided message (not found messages are already user-friendly)
 */
export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      // Not found messages are typically user-friendly, so use the message itself
      displayMessage: options?.displayMessage || message,
    });
  }
}

/**
 * 409 Conflict - Request conflicts with current state (e.g., duplicate entry)
 * Default display message: "This action conflicts with existing data"
 */
export class ConflictError extends BaseError {
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'This action conflicts with existing data',
    });
  }
}

/**
 * 422 Unprocessable Entity - Request is well-formed but semantically incorrect
 * Display message: Uses provided message (semantic errors are typically user-friendly)
 */
export class UnprocessableEntityError extends BaseError {
  readonly statusCode = 422;
  readonly isOperational = true;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      // Semantic error messages are typically user-friendly, so use the message itself
      displayMessage: options?.displayMessage || message,
    });
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 * Default display message: "Too many requests. Please try again later"
 */
export class TooManyRequestsError extends BaseError {
  readonly statusCode = 429;
  readonly isOperational = true;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'Too many requests. Please try again later',
    });
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 * Default display message: "Something went wrong. Please try again"
 */
export class InternalServerError extends BaseError {
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'Something went wrong. Please try again',
    });
  }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 * Default display message: "Service temporarily unavailable"
 */
export class ServiceUnavailableError extends BaseError {
  readonly statusCode = 503;
  readonly isOperational = true;

  constructor(
    message: string,
    cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'Service temporarily unavailable',
    });
  }
}
