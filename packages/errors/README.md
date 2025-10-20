# @phone-games/errors

Centralized error handling package providing standardized error types for the phone-games platform.

## Overview

This package provides a hierarchical error system with custom error classes for different error categories. All errors extend from a base error class and include proper stack traces, error codes, and metadata.

## Error Categories

### HTTP Errors
HTTP-related errors with appropriate status codes:

- `BadRequestError` (400) - Invalid request parameters
- `UnauthorizedError` (401) - Authentication required
- `ForbiddenError` (403) - Access denied
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource conflict
- `InternalServerError` (500) - Internal server error

### Domain Errors
Business logic and domain-specific errors:

- `PartyNotFoundError` - Party does not exist
- `UserNotFoundError` - User does not exist
- `InvalidGameStateError` - Game state is invalid
- `MessageParsingError` - Failed to parse message
- `ExternalServiceError` - External service failure
- `ValidationError` - Data validation failed

## Usage

```typescript
import {
  NotFoundError,
  PartyNotFoundError,
  ValidationError
} from '@phone-games/errors';

// HTTP errors
throw new NotFoundError('Resource not found', { resourceId: '123' });

// Domain errors
throw new PartyNotFoundError('Party does not exist', { partyId: 'abc' });

// With metadata
throw new ValidationError('Invalid input', {
  field: 'username',
  value: 'invalid!@#',
  constraint: 'alphanumeric'
});
```

## Error Properties

All errors include:

```typescript
{
  name: string;        // Error class name
  message: string;     // Human-readable message
  statusCode?: number; // HTTP status code (for HTTP errors)
  metadata?: object;   // Additional error context
  stack?: string;      // Stack trace
}
```

## Error Utilities

### `isOperationalError(error)`
Check if an error is an expected operational error (vs programmer error).

```typescript
import { isOperationalError } from '@phone-games/errors';

try {
  await someOperation();
} catch (error) {
  if (isOperationalError(error)) {
    // Handle gracefully
    logger.warn('Expected error', error);
  } else {
    // Programmer error - should crash
    logger.error('Unexpected error', error);
    throw error;
  }
}
```

## Design Pattern

All errors follow a consistent structure:

```typescript
export class MyCustomError extends BaseError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, metadata);
    this.name = 'MyCustomError';
    this.statusCode = 400; // Optional, for HTTP errors
  }
}
```

## Benefits

- **Type Safety**: TypeScript types for all error classes
- **Consistent Structure**: All errors follow the same pattern
- **Rich Context**: Metadata for debugging
- **HTTP Integration**: Status codes for API responses
- **Stack Traces**: Proper stack trace preservation
- **Operational vs Programmer Errors**: Clear distinction for error handling

## Dependencies

None - this is a standalone utility package.
