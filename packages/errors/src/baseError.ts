/**
 * Base error class for all custom errors in the application.
 * Provides consistent error handling with HTTP status codes and operational flags.
 */
export abstract class BaseError extends Error {
  /**
   * HTTP status code associated with this error
   */
  abstract readonly statusCode: number;

  /**
   * Indicates if this is an operational error (expected) vs programming error (unexpected)
   * Operational errors are safe to expose to clients, programming errors should be logged only
   */
  abstract readonly isOperational: boolean;

  /**
   * Optional error code for machine-readable error identification
   */
  public readonly code?: string;

  /**
   * Additional context/metadata about the error
   */
  public readonly context?: Record<string, unknown>;

  /**
   * User-friendly message safe to display to end users
   * Falls back to technical message if not provided
   */
  private readonly _displayMessage?: string;

  /**
   * Get the user-friendly display message
   * Returns displayMessage if provided, otherwise falls back to the technical message
   */
  public get displayMessage(): string {
    return this._displayMessage || this.message;
  }

  constructor(
    message: string,
    public readonly cause?: Error,
    options?: {
      code?: string;
      context?: Record<string, unknown>;
      displayMessage?: string;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options?.code;
    this.context = options?.context;
    this._displayMessage = options?.displayMessage;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    type ErrorWithCapture = typeof Error & {
      captureStackTrace?: (targetObject: object, constructorOpt?: new (...args: unknown[]) => unknown) => void
    };
    const ErrorCtor = Error as ErrorWithCapture;
    if (typeof ErrorCtor.captureStackTrace === 'function') {
      ErrorCtor.captureStackTrace(this, this.constructor as new (...args: unknown[]) => unknown);
    }
  }

  /**
   * Serialize error to JSON for logging or API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      context: this.context,
      ...(this.cause && { cause: this.cause.message }),
    };
  }
}
