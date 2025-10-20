# @phone-games/logger

Structured logging package built on Pino for the phone-games platform.

## Overview

Provides a consistent logging interface with support for structured logging, log levels, and context enrichment. Built on top of Pino for high-performance JSON logging.

## Features

- **Structured Logging**: JSON-formatted logs for easy parsing
- **Log Levels**: trace, debug, info, warn, error, fatal
- **Child Loggers**: Create contextual loggers with inherited metadata
- **Type Safe**: Full TypeScript support
- **High Performance**: Built on Pino, one of the fastest Node.js loggers
- **Context Enrichment**: Add metadata to log entries

## Usage

### Basic Logging

```typescript
import { Logger } from '@phone-games/logger';

const logger = new Logger({
  level: 'info',
  name: 'my-service'
});

logger.info('Server started', { port: 3000 });
logger.warn('Slow query detected', { duration: 5000, query: 'SELECT * FROM users' });
logger.error('Database connection failed', new Error('Connection timeout'));
```

### Child Loggers

Create child loggers with inherited context:

```typescript
const logger = new Logger({ name: 'app' });

// Child logger inherits parent context and adds its own
const serviceLogger = logger.child({ service: 'UserService' });
serviceLogger.info('User created', { userId: '123' });
// Output: { level: 'info', service: 'UserService', msg: 'User created', userId: '123' }

const requestLogger = logger.child({ requestId: 'req-456' });
requestLogger.info('Processing request');
// Output: { level: 'info', requestId: 'req-456', msg: 'Processing request' }
```

### Log Levels

```typescript
logger.trace('Very detailed info');  // Development debugging
logger.debug('Debug information');   // Development
logger.info('General information');  // Production
logger.warn('Warning message');      // Production
logger.error('Error occurred');      // Production
logger.fatal('Fatal error');         // Production (critical)
```

### With Context

```typescript
// Add context to individual log entries
logger.info('User login', {
  userId: '123',
  email: 'user@example.com',
  timestamp: Date.now()
});

// With error
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'riskyOperation',
    userId: '123'
  });
}
```

## Configuration

```typescript
interface LoggerConfig {
  level?: LogLevel;           // Minimum log level (default: 'info')
  name?: string;              // Logger name
  prettyPrint?: boolean;      // Pretty print for development (default: false)
}

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
```

### Development vs Production

```typescript
// Development - pretty printed logs
const devLogger = new Logger({
  level: 'debug',
  name: 'dev-app',
  prettyPrint: true
});

// Production - JSON logs
const prodLogger = new Logger({
  level: 'info',
  name: 'prod-app',
  prettyPrint: false
});
```

## Interface

```typescript
interface ILogger {
  trace(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  fatal(message: string, error?: Error, context?: LogContext): void;
  child(context: LogContext): ILogger;
}

type LogContext = Record<string, any>;
```

## Best Practices

### 1. Use Child Loggers for Context

```typescript
// ✅ Good - context automatically included
const userLogger = logger.child({ userId: user.id });
userLogger.info('Profile updated');
userLogger.info('Password changed');

// ❌ Bad - repeating context
logger.info('Profile updated', { userId: user.id });
logger.info('Password changed', { userId: user.id });
```

### 2. Log Structured Data

```typescript
// ✅ Good - structured, parseable
logger.info('Request processed', {
  method: 'POST',
  path: '/api/users',
  duration: 145,
  statusCode: 201
});

// ❌ Bad - unstructured string
logger.info(`Request POST /api/users took 145ms and returned 201`);
```

### 3. Use Appropriate Log Levels

```typescript
// trace: Very detailed debugging (disabled in production)
logger.trace('Entering function', { args });

// debug: Detailed debugging (disabled in production)
logger.debug('Query result', { rows: results.length });

// info: General information (enabled in production)
logger.info('User logged in', { userId });

// warn: Warning, but application continues
logger.warn('Rate limit approaching', { current: 95, limit: 100 });

// error: Error occurred, but application continues
logger.error('Failed to send email', error, { userId });

// fatal: Critical error, application may crash
logger.fatal('Database unavailable', error);
```

### 4. Don't Log Sensitive Data

```typescript
// ✅ Good - no sensitive data
logger.info('User authenticated', { userId: user.id });

// ❌ Bad - contains password
logger.info('User authenticated', { userId: user.id, password: user.password });
```

## Integration Example

```typescript
import { Logger, ILogger } from '@phone-games/logger';

class UserService {
  private logger: ILogger;

  constructor(logger: ILogger) {
    // Create child logger for this service
    this.logger = logger.child({ service: 'UserService' });
  }

  async createUser(userData: any) {
    this.logger.info('Creating user', { username: userData.username });

    try {
      const user = await this.repository.create(userData);
      this.logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error, {
        username: userData.username
      });
      throw error;
    }
  }
}

// Usage
const logger = new Logger({ level: 'info', name: 'app' });
const userService = new UserService(logger);
```

## Output Format

### JSON (Production)
```json
{"level":30,"time":1635789012345,"name":"app","service":"UserService","msg":"User created","userId":"123"}
```

### Pretty Print (Development)
```
[1635789012345] INFO (app/UserService): User created
    userId: "123"
```

## Dependencies

- `pino`: High-performance JSON logger
- `pino-pretty`: Pretty printing for development

## Performance

Pino is designed for minimal performance overhead:
- Asynchronous logging
- JSON serialization optimizations
- Minimal allocations
- Zero dependencies for core functionality
