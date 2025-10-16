import { BaseError } from './baseError.js';

/**
 * 400 Bad Request - Client sent invalid data
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
    }
  ) {
    super(message, cause, options);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
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
    }
  ) {
    super(message, cause, options);
  }
}

/**
 * 403 Forbidden - User doesn't have permission
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
    }
  ) {
    super(message, cause, options);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
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
    }
  ) {
    super(message, cause, options);
  }
}

/**
 * 409 Conflict - Request conflicts with current state (e.g., duplicate entry)
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
    }
  ) {
    super(message, cause, options);
  }
}

/**
 * 422 Unprocessable Entity - Request is well-formed but semantically incorrect
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
    }
  ) {
    super(message, cause, options);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
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
    }
  ) {
    super(message, cause, options);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
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
    }
  ) {
    super(message, cause, options);
  }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
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
    }
  ) {
    super(message, cause, options);
  }
}
