import { BaseError } from './baseError.js';

/**
 * Game-specific errors
 * Default display message: "Game error. Please try again"
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
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'Game error. Please try again',
    });
  }
}

/**
 * Party/Room-specific errors
 * Default display message: "Party not found. Create one with /create_party"
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
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'Party not found. Create one with /create_party',
    });
  }
}

/**
 * User/Authentication-specific errors
 * Default display message: "User not found"
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
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'User not found',
    });
  }
}

/**
 * Database-specific errors
 * Default display message: "Something went wrong. Please try again"
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
 * External service/API errors
 * Default display message: "Something went wrong. Please try again"
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
 * Message parsing errors
 * Default display message: "Unknown command. Type /help for available commands"
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
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'Unknown command. Type /help for available commands',
    });
  }
}

/**
 * Notification delivery errors
 * Default display message: "Failed to send notification"
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
      displayMessage?: string;
    }
  ) {
    super(message, cause, {
      ...options,
      displayMessage: options?.displayMessage || 'Failed to send notification',
    });
  }
}
