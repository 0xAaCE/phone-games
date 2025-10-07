export class ValidationError extends Error {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConflictError';
  }
}
