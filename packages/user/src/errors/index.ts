export class ValidationError extends Error {
  readonly isOperational = true;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  readonly isOperational = true;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  readonly isOperational = true;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConflictError';
  }
}
