import { BaseError } from './baseError.js';

/**
 * Game-specific errors
 */
export class GameError extends BaseError {
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
 * Party/Room-specific errors
 */
export class PartyError extends BaseError {
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
 * User/Authentication-specific errors
 */
export class UserError extends BaseError {
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
 * Database-specific errors
 */
export class DatabaseError extends BaseError {
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
 * External service/API errors
 */
export class ExternalServiceError extends BaseError {
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

/**
 * Message parsing errors
 */
export class MessageParsingError extends BaseError {
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
 * Notification delivery errors
 */
export class NotificationError extends BaseError {
  readonly statusCode = 500;
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
