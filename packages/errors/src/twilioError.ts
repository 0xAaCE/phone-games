import { BaseError } from "./baseError.js";

export class TwilioError extends BaseError {
  readonly statusCode = 500;
  readonly isOperational = true;

  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}