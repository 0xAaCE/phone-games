# @phone-games/user

User management service for the phone-games platform.

## Overview

Provides user-related business logic including user registration, profile management, and user queries. Built on top of the Repository Pattern for clean separation of concerns.

## Features

- User registration and profile management
- User lookup by various identifiers (ID, username, phone number)
- Repository Pattern for data access abstraction
- Type-safe operations with TypeScript

## Architecture

```
UserService → IUserRepository → PrismaUserRepository → Database
```

## User Service

### Interface

```typescript
class UserService {
  constructor(userRepository: IUserRepository);

  // Queries
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | null>;

  // Commands
  createUser(data: CreateUserData): Promise<User>;
  updateUser(id: string, data: UpdateUserData): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
```

## Usage

### Initialize Service

```typescript
import { UserService } from '@phone-games/user';
import { PrismaUserRepository } from '@phone-games/repositories';
import { db } from '@phone-games/db';

const userRepository = new PrismaUserRepository(db);
const userService = new UserService(userRepository);
```

### Create User

```typescript
const user = await userService.createUser({
  id: 'uuid-generated-from-wa-id',
  username: 'john_doe',
  phoneNumber: '+1234567890'
});

console.log(user);
// {
//   id: 'uuid-generated-from-wa-id',
//   username: 'john_doe',
//   phoneNumber: '+1234567890',
//   createdAt: Date
// }
```

### Get User

```typescript
// By ID
const user = await userService.getUserById('user-123');

// By username
const user = await userService.getUserByUsername('john_doe');

// By phone number
const user = await userService.getUserByPhoneNumber('+1234567890');
```

### Update User

```typescript
const updatedUser = await userService.updateUser('user-123', {
  username: 'jane_doe'
});
```

### Delete User

```typescript
await userService.deleteUser('user-123');
```

## User Data Model

```typescript
interface User {
  id: string;           // UUID generated from WhatsApp ID
  username: string;     // Display name from messaging platform
  phoneNumber: string;  // Phone number (unique)
  createdAt: Date;      // Registration timestamp
}

interface CreateUserData {
  id: string;
  username: string;
  phoneNumber: string;
}

interface UpdateUserData {
  username?: string;
  phoneNumber?: string;
}
```

## Error Handling

```typescript
import { UserNotFoundError } from '@phone-games/errors';

try {
  const user = await userService.getUserById('invalid-id');
  if (!user) {
    throw new UserNotFoundError('User not found');
  }
} catch (error) {
  if (error instanceof UserNotFoundError) {
    // Handle user not found
    console.error('User does not exist');
  } else {
    // Handle other errors
    console.error('Unexpected error', error);
  }
}
```

## Integration Example

### With Messaging Service

```typescript
import { UserService } from '@phone-games/user';
import { MessageHandlerService } from '@phone-games/messaging';

class MessageHandlerService {
  constructor(
    private userService: UserService,
    // ... other dependencies
  ) {}

  async handle(message: IncomingMessage) {
    // Parse message to get user info
    const { user: userInfo } = await parser.parse(message);

    // Check if user exists, create if not
    let user = await this.userService.getUserById(userInfo.id);
    if (!user) {
      user = await this.userService.createUser(userInfo);
    }

    // Continue processing...
  }
}
```

### With Party Service

```typescript
import { UserService } from '@phone-games/user';
import { PartyManagerService } from '@phone-games/party';

class PartyManagerService {
  constructor(
    private userService: UserService,
    // ... other dependencies
  ) {}

  async createParty(userId: string, partyName: string) {
    // Verify user exists
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new UserNotFoundError('User not found');
    }

    // Create party with this user as owner
    // ...
  }
}
```

## Testing

### Unit Tests with Mock Repository

```typescript
import { UserService } from '@phone-games/user';
import { IUserRepository } from '@phone-games/repositories';

class MockUserRepository implements IUserRepository {
  private users = new Map<string, User>();

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async createUser(data: CreateUserData): Promise<User> {
    const user = { ...data, createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  // ... implement other methods
}

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    userService = new UserService(mockRepository);
  });

  it('should create user', async () => {
    const user = await userService.createUser({
      id: 'test-id',
      username: 'test_user',
      phoneNumber: '+1234567890'
    });

    expect(user.id).toBe('test-id');
    expect(user.username).toBe('test_user');
  });

  it('should find user by id', async () => {
    await userService.createUser({
      id: 'test-id',
      username: 'test_user',
      phoneNumber: '+1234567890'
    });

    const found = await userService.getUserById('test-id');
    expect(found).toBeDefined();
    expect(found?.username).toBe('test_user');
  });
});
```

## Best Practices

### 1. Always Check for User Existence

```typescript
// ✅ Good - handle null case
const user = await userService.getUserById(userId);
if (!user) {
  throw new UserNotFoundError('User not found');
}

// ❌ Bad - assumes user exists
const user = await userService.getUserById(userId);
console.log(user.username); // Might throw if null
```

### 2. Use Dependency Injection

```typescript
// ✅ Good - inject repository
class MyService {
  constructor(private userService: UserService) {}
}

// ❌ Bad - create inside class
class MyService {
  private userService = new UserService(new PrismaUserRepository(db));
}
```

### 3. Validate Phone Numbers

```typescript
// ✅ Good - validate format
const phoneRegex = /^\+[1-9]\d{1,14}$/;
if (!phoneRegex.test(phoneNumber)) {
  throw new ValidationError('Invalid phone number format');
}
await userService.createUser({ id, username, phoneNumber });
```

## Dependencies

- `@phone-games/repositories`: User repository interface and implementations
- `@phone-games/db`: Database types (User, Prisma types)
- `@phone-games/errors`: Error types (UserNotFoundError, ValidationError)

## Related Packages

- `@phone-games/messaging`: Creates users from incoming messages
- `@phone-games/party`: Validates user existence for party operations
- `@phone-games/repositories`: Provides data access layer
