import { describe, it, expect } from 'vitest';
import {
  BaseError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  GameError,
  PartyError,
  UserError,
  DatabaseError,
  ExternalServiceError,
  MessageParsingError,
  NotificationError,
  isBaseError,
  isOperationalError,
  getErrorStatusCode,
  formatErrorForLogging,
  formatErrorForClient,
} from '../internal.js';

describe('BaseError', () => {
  it('should capture error properties', () => {
    class TestError extends BaseError {
      readonly statusCode = 400;
      readonly isOperational = true;
    }

    const error = new TestError('Test message', undefined, {
      code: 'TEST_CODE',
      context: { foo: 'bar' },
    });

    expect(error.message).toBe('Test message');
    expect(error.name).toBe('TestError');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.code).toBe('TEST_CODE');
    expect(error.context).toEqual({ foo: 'bar' });
  });

  it('should serialize to JSON', () => {
    class TestError extends BaseError {
      readonly statusCode = 500;
      readonly isOperational = false;
    }

    const error = new TestError('Test error');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'TestError',
      message: 'Test error',
      statusCode: 500,
      code: undefined,
      context: undefined,
    });
  });

  it('should include cause in JSON', () => {
    class TestError extends BaseError {
      readonly statusCode = 500;
      readonly isOperational = false;
    }

    const cause = new Error('Original error');
    const error = new TestError('Wrapped error', cause);
    const json = error.toJSON();

    expect(json.cause).toBe('Original error');
  });
});

describe('HTTP Errors', () => {
  it('ValidationError should have correct properties', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('ValidationError');
  });

  it('UnauthorizedError should have correct properties', () => {
    const error = new UnauthorizedError('Not authenticated');
    expect(error.statusCode).toBe(401);
    expect(error.isOperational).toBe(true);
  });

  it('ForbiddenError should have correct properties', () => {
    const error = new ForbiddenError('No permission');
    expect(error.statusCode).toBe(403);
    expect(error.isOperational).toBe(true);
  });

  it('NotFoundError should have correct properties', () => {
    const error = new NotFoundError('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it('ConflictError should have correct properties', () => {
    const error = new ConflictError('Duplicate entry');
    expect(error.statusCode).toBe(409);
    expect(error.isOperational).toBe(true);
  });

  it('UnprocessableEntityError should have correct properties', () => {
    const error = new UnprocessableEntityError('Semantically incorrect');
    expect(error.statusCode).toBe(422);
    expect(error.isOperational).toBe(true);
  });

  it('TooManyRequestsError should have correct properties', () => {
    const error = new TooManyRequestsError('Rate limit exceeded');
    expect(error.statusCode).toBe(429);
    expect(error.isOperational).toBe(true);
  });

  it('InternalServerError should have correct properties', () => {
    const error = new InternalServerError('Unexpected error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });

  it('ServiceUnavailableError should have correct properties', () => {
    const error = new ServiceUnavailableError('Service down');
    expect(error.statusCode).toBe(503);
    expect(error.isOperational).toBe(true);
  });
});

describe('Domain Errors', () => {
  it('GameError should have correct properties', () => {
    const error = new GameError('Invalid game state');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('GameError');
  });

  it('PartyError should have correct properties', () => {
    const error = new PartyError('Party is full');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('UserError should have correct properties', () => {
    const error = new UserError('User already exists');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('DatabaseError should have correct properties', () => {
    const error = new DatabaseError('Connection failed');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });

  it('ExternalServiceError should have correct properties', () => {
    const error = new ExternalServiceError('API timeout');
    expect(error.statusCode).toBe(503);
    expect(error.isOperational).toBe(true);
  });

  it('MessageParsingError should have correct properties', () => {
    const error = new MessageParsingError('Invalid format');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('NotificationError should have correct properties', () => {
    const error = new NotificationError('Failed to send');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });
});

describe('Error Utilities', () => {
  describe('isBaseError', () => {
    it('should return true for BaseError instances', () => {
      const error = new ValidationError('Test');
      expect(isBaseError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Test');
      expect(isBaseError(error)).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isBaseError('string')).toBe(false);
      expect(isBaseError(null)).toBe(false);
      expect(isBaseError(undefined)).toBe(false);
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational errors', () => {
      const error = new ValidationError('Test');
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-operational errors', () => {
      const error = new InternalServerError('Test');
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for non-BaseError', () => {
      const error = new Error('Test');
      expect(isOperationalError(error)).toBe(false);
    });
  });

  describe('getErrorStatusCode', () => {
    it('should return correct status code for BaseError', () => {
      const error = new NotFoundError('Test');
      expect(getErrorStatusCode(error)).toBe(404);
    });

    it('should return 500 for non-BaseError', () => {
      const error = new Error('Test');
      expect(getErrorStatusCode(error)).toBe(500);
    });
  });

  describe('formatErrorForLogging', () => {
    it('should format BaseError', () => {
      const error = new ValidationError('Test', undefined, {
        code: 'VAL_001',
        context: { field: 'email' },
      });
      const formatted = formatErrorForLogging(error);

      expect(formatted).toEqual({
        name: 'ValidationError',
        message: 'Test',
        statusCode: 400,
        code: 'VAL_001',
        context: { field: 'email' },
      });
    });

    it('should format regular Error', () => {
      const error = new Error('Test error');
      const formatted = formatErrorForLogging(error);

      expect(formatted.name).toBe('Error');
      expect(formatted.message).toBe('Test error');
      expect(formatted.stack).toBeDefined();
    });

    it('should format non-Error values', () => {
      const formatted = formatErrorForLogging('string error');
      expect(formatted).toEqual({ error: 'string error' });
    });
  });

  describe('formatErrorForClient', () => {
    it('should format operational BaseError with full message', () => {
      const error = new ValidationError('Invalid email format', undefined, {
        code: 'VAL_EMAIL',
      });
      const formatted = formatErrorForClient(error);

      expect(formatted).toEqual({
        message: 'Invalid email format',
        statusCode: 400,
        code: 'VAL_EMAIL',
      });
    });

    it('should hide message for non-operational errors', () => {
      const error = new InternalServerError('Database connection failed');
      const formatted = formatErrorForClient(error);

      expect(formatted).toEqual({
        message: 'An unexpected error occurred',
        statusCode: 500,
        code: undefined,
      });
    });

    it('should format non-BaseError as generic error', () => {
      const error = new Error('Some error');
      const formatted = formatErrorForClient(error);

      expect(formatted).toEqual({
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    });
  });
});
