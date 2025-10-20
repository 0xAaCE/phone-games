# @phone-games/repositories

Repository implementations following the Repository Pattern for data access in the phone-games platform.

## Overview

This package provides repository interfaces and Prisma implementations for data access. Repositories abstract the data layer, allowing services to work with domain entities without knowing the underlying database implementation.

## Design Pattern: Repository Pattern

The Repository Pattern provides:
- **Abstraction**: Services don't depend on specific database implementations
- **Testability**: Easy to mock repositories for unit tests
- **Flexibility**: Can swap implementations (e.g., Prisma → TypeORM) without changing services
- **Single Responsibility**: Repositories handle data access, services handle business logic

## Architecture

```
┌─────────────┐
│   Service   │  (Business Logic)
└──────┬──────┘
       │ depends on
       ▼
┌─────────────┐
│  IRepository│  (Interface)
└──────┬──────┘
       │ implemented by
       ▼
┌─────────────┐
│PrismaRepository│  (Implementation)
└──────┬──────┘
       │ uses
       ▼
┌─────────────┐
│   Prisma    │  (ORM)
└─────────────┘
```

## Available Repositories

### User Repository
Manages user data access.

**Interface:**
```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
}
```

**Implementation:**
```typescript
class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // ... other methods
}
```

### Party Repository
Manages party/lobby data access.

**Interface:**
```typescript
interface IPartyRepository {
  findById(id: string): Promise<Party | null>;
  findByUserId(userId: string): Promise<Party | null>;
  create(data: CreatePartyData): Promise<Party>;
  update(id: string, data: UpdatePartyData): Promise<Party>;
  addPlayer(partyId: string, userId: string): Promise<void>;
  removePlayer(partyId: string, userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## Usage

### In Services

```typescript
import { IUserRepository, PrismaUserRepository } from '@phone-games/repositories';
import { db } from '@phone-games/db';

class UserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }
}

// Dependency injection
const userRepository = new PrismaUserRepository(db);
const userService = new UserService(userRepository);
```

### In Tests

```typescript
import { IUserRepository } from '@phone-games/repositories';

class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = { ...data, id: 'mock-id', createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  // ... other methods
}

// Test without database
describe('UserService', () => {
  it('should create user', async () => {
    const mockRepo = new MockUserRepository();
    const service = new UserService(mockRepo);

    const user = await service.createUser({
      username: 'test',
      phoneNumber: '+1234567890'
    });

    expect(user.id).toBe('mock-id');
  });
});
```

## Benefits

### 1. Testability
Services can be tested without a database:

```typescript
// Unit test with mock
const mockRepo = new MockUserRepository();
const service = new UserService(mockRepo);
```

### 2. Flexibility
Swap implementations without changing service code:

```typescript
// Development - use Prisma
const repo = new PrismaUserRepository(db);

// Testing - use in-memory
const repo = new InMemoryUserRepository();

// Same service code works with both!
const service = new UserService(repo);
```

### 3. Encapsulation
Complex queries are hidden in repositories:

```typescript
// ❌ Bad - complex Prisma query in service
const parties = await db.party.findMany({
  where: {
    players: {
      some: { id: userId }
    }
  },
  include: {
    owner: true,
    players: true
  }
});

// ✅ Good - repository handles complexity
const parties = await partyRepository.findByUserId(userId);
```

### 4. Single Responsibility
- **Repositories**: Data access only
- **Services**: Business logic only

## Repository Methods Naming Convention

Follow consistent naming for repository methods:

- `findById(id)` - Find single entity by ID
- `findByX(x)` - Find single entity by property X
- `findAll()` - Find all entities
- `findMany(filter)` - Find multiple entities with filter
- `create(data)` - Create new entity
- `update(id, data)` - Update existing entity
- `delete(id)` - Delete entity
- `exists(id)` - Check if entity exists
- `count(filter)` - Count entities

## Error Handling

Repositories should throw domain errors, not database errors:

```typescript
async findById(id: string): Promise<User> {
  try {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new UserNotFoundError(`User not found: ${id}`);
    }
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Convert Prisma errors to domain errors
      throw new DatabaseError('Failed to fetch user', error);
    }
    throw error;
  }
}
```

## Creating New Repositories

### 1. Define Interface

```typescript
// interfaces/productRepository.ts
export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

### 2. Implement with Prisma

```typescript
// prisma/prismaProductRepository.ts
import { PrismaClient } from '@phone-games/db';
import { IProductRepository } from '../interfaces/productRepository';

export class PrismaProductRepository implements IProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany();
  }

  async create(data: CreateProductData): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
```

### 3. Export

```typescript
// index.ts
export * from './interfaces/productRepository';
export * from './prisma/prismaProductRepository';
```

## Dependencies

- `@phone-games/db`: Prisma client and types
- `@phone-games/errors`: Error types for domain errors

## Related Packages

- `@phone-games/user`: Uses IUserRepository
- `@phone-games/party`: Uses IPartyRepository
- `@phone-games/db`: Provides Prisma client
