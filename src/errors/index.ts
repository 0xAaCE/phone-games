export abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

export class ConflictError extends BaseError {
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

export class DatabaseError extends BaseError {
  readonly statusCode = 500;
  readonly isOperational = true;

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

export class UnauthorizedError extends BaseError {
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

export class ForbiddenError extends BaseError {
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}