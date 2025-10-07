# Error Handling Strategy

## Overview

Error classes are **NOT** shared across packages. Each package defines its own domain-specific errors to maintain package independence and avoid circular dependencies.

## Error Distribution

### `@phone-games/user` Errors

Located in: `packages/user/src/errors/`

```typescript
export class ValidationError extends Error {
  readonly statusCode = 400;
  readonly isOperational = true;
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  readonly isOperational = true;
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  readonly isOperational = true;
}
```

**Used for**: User validation, user not found, duplicate users

---

### `@phone-games/party` Errors

Located in: `packages/party/src/errors/`

```typescript
export class ValidationError extends Error {
  readonly statusCode = 400;
  readonly isOperational = true;
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  readonly isOperational = true;
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  readonly isOperational = true;
}
```

**Used for**: Party validation, party/game state not found, duplicate party actions

---

### `@phone-games/server` Errors

Located in: `apps/server/src/errors/`

```typescript
export abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
}

export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly isOperational = true;
}

export class UnauthorizedError extends BaseError {
  readonly statusCode = 401;
  readonly isOperational = true;
}
```

**Used for**: HTTP-level validation, authentication/authorization errors, error handling middleware

---

## Design Rationale

### Why Not a Shared Errors Package?

1. **Package Independence**: Each package can be used independently without pulling in unnecessary dependencies
2. **Domain Clarity**: Errors are specific to their domain context
3. **No Circular Dependencies**: Packages don't need to depend on each other for error types
4. **Simpler Dependency Graph**: Fewer packages to manage
5. **Easier Testing**: Each package can be tested in isolation

### Why Duplicate Error Classes?

- **Low Maintenance Cost**: Error classes are simple and rarely change
- **Clear Ownership**: Each package owns its error behavior
- **Type Safety**: Each package has its own error types without import chains
- **Flexibility**: Packages can customize error behavior independently if needed

## Usage Examples

### In User Package

```typescript
import { ValidationError, NotFoundError } from '@phone-games/user';

const user = await userService.getUser(id);
if (!user) {
  throw new NotFoundError('User not found');
}
```

### In Party Package

```typescript
import { ConflictError } from '@phone-games/party';

if (existingPlayer) {
  throw new ConflictError('User is already in this party');
}
```

### In Server

```typescript
import { ValidationError } from '../errors';
import { NotFoundError as UserNotFoundError } from '@phone-games/user';
import { ConflictError as PartyConflictError } from '@phone-games/party';

// Use local ValidationError for request validation
if (!req.body.userId) {
  throw new ValidationError('User ID required');
}

// Service errors bubble up naturally
const user = await userService.getUser(id); // Throws UserNotFoundError
const party = await partyService.joinParty(userId, partyId); // Throws PartyConflictError
```

## Error Handling in Server

The `errorHandler` middleware in `apps/server/src/middleware/errorHandler.ts` catches all errors:

```typescript
// Handles BaseError instances (server errors)
if (error instanceof BaseError) {
  res.status(error.statusCode).json({ ... });
}

// Handles service errors by name
if (error.name === 'ValidationError') {
  res.status(400).json({ ... });
}

// Handles Prisma errors
if (error.name === 'PrismaClientKnownRequestError') {
  // Handle specific Prisma error codes
}
```

## Best Practices

1. **Throw Domain-Specific Errors**: Use the error classes from the package you're in
2. **Let Errors Bubble**: Don't catch and re-throw unnecessarily
3. **Use Error Names**: When catching errors from other packages, use `error.name` for type checking
4. **Add Context**: Include relevant details in error messages
5. **Keep Errors Simple**: Don't add complex logic to error classes

## Future Considerations

If error classes need to become more complex or shared behavior is needed:

1. Consider a base error interface (not class) in a types package
2. Create utility functions for error handling
3. Use error codes instead of class inheritance
4. Document error contracts in API documentation
