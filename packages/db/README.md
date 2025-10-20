# @phone-games/db

Database package providing Prisma ORM client and type definitions for the phone-games platform.

## Overview

This package contains the Prisma configuration, schema definitions, and generated Prisma client for database access. It provides a centralized, type-safe database layer used by all other packages.

## Features

- **Type-Safe Queries**: Auto-generated TypeScript types
- **Schema Management**: Centralized Prisma schema
- **Migrations**: Database migration support
- **Multi-Database**: Configured for PostgreSQL
- **Generated Client**: Ready-to-use PrismaClient instance

## Database Schema

### User
Stores user information from messaging platforms:
```prisma
model User {
  id          String   @id
  username    String
  phoneNumber String   @unique
  createdAt   DateTime @default(now())
  parties     Party[]  @relation("UserParties")
  ownedParties Party[] @relation("PartyOwner")
}
```

### Party
Game party/lobby:
```prisma
model Party {
  id        String   @id @default(uuid())
  name      String
  ownerId   String
  owner     User     @relation("PartyOwner", fields: [ownerId], references: [id])
  players   User[]   @relation("UserParties")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Usage

```typescript
import { db, PrismaClient, User, Party } from '@phone-games/db';

// Use the default client instance
const users = await db.user.findMany();

// Or create your own instance
const prisma = new PrismaClient();
const user = await prisma.user.create({
  data: {
    id: 'user-123',
    username: 'john_doe',
    phoneNumber: '+1234567890'
  }
});
```

## Scripts

### Generate Prisma Client
```bash
pnpm db:generate
```

### Create Migration
```bash
pnpm db:migrate
```

### Push Schema (Dev)
```bash
pnpm db:push
```

## Configuration

Database connection is configured via environment variable:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/phone_games?schema=public"
```

## File Structure

```
packages/db/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── generated/         # Generated Prisma client (gitignored)
│   ├── external.ts        # Public exports
│   └── index.ts          # Main entry point
└── package.json
```

## Type Exports

All Prisma types are exported for use in other packages:

```typescript
import type {
  User,
  Party,
  Prisma,
  PrismaClient
} from '@phone-games/db';
```

## Best Practices

### 1. Use Repository Pattern
Don't use Prisma directly in services. Use repositories:

```typescript
// ❌ Bad - direct Prisma in service
class UserService {
  async getUser(id: string) {
    return db.user.findUnique({ where: { id } });
  }
}

// ✅ Good - use repository
class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getUser(id: string) {
    return this.userRepository.findById(id);
  }
}
```

### 2. Handle Errors
Prisma can throw various errors - handle them appropriately:

```typescript
import { Prisma } from '@phone-games/db';

try {
  await db.user.create({ data: userData });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictError('User already exists');
    }
  }
  throw error;
}
```

### 3. Use Transactions
For operations that must succeed or fail together:

```typescript
await db.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.party.create({
    data: {
      name: 'My Party',
      ownerId: user.id
    }
  });
});
```

## Dependencies

- `@prisma/client`: Prisma ORM client
- `prisma`: Prisma CLI (dev dependency)

## Related Packages

- `@phone-games/repositories`: Repository implementations using this package
- `@phone-games/user`: User service using user repository
- `@phone-games/party`: Party service using party repository
