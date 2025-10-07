# Package Structure

## Overview

The monorepo is organized into domain-specific packages:

```
phone_games/
├── apps/
│   └── server/              # Express API server (controllers, routes, middleware)
├── packages/
│   ├── db/                  # Database (Prisma)
│   ├── games/               # Game logic & factory
│   ├── errors/              # Shared error classes
│   ├── user/                # User service & logic
│   └── party/               # Party management service & schemas
└── docs/
```

## Package Details

### `@phone-games/db`
**Purpose**: Database schema and Prisma client

**Exports**:
- `PrismaClient`
- All Prisma-generated types (`User`, `Party`, `PartyPlayer`, etc.)
- `db` - Pre-configured Prisma client instance

**Dependencies**: None (base package)

---

### `@phone-games/games`
**Purpose**: Game interfaces, implementations, and factory pattern

**Exports**:
- `Game` - Abstract base class
- `GameFactory` - Creates game instances
- `ImpostorGame` - Implementation
- Game interfaces and types
- `GAME_NAMES` constant

**Dependencies**: `@phone-games/db`

---

### `@phone-games/user`
**Purpose**: User management and business logic

**Exports**:
- `UserService` - User CRUD operations
- `CreateUserData` - Interface for user creation
- `ValidationError`, `NotFoundError`, `ConflictError` - Domain-specific errors

**Dependencies**:
- `@phone-games/db`

---

### `@phone-games/party`
**Purpose**: Party/game session management

**Exports**:
- `PartyManagerService` - Party and game state management
- `validGameSchemas` - Zod schema for game name validation
- `ValidationError`, `NotFoundError`, `ConflictError` - Domain-specific errors

**Dependencies**:
- `@phone-games/db`
- `@phone-games/games`
- `zod`

---

### `@phone-games/server` (App)
**Purpose**: HTTP API layer

**Contains**:
- Controllers (`UserController`, `PartyController`)
- Routes (`userRoutes`, `partyRoutes`)
- Middleware (`auth`, `errorHandler`)
- Express app configuration
- Server-specific errors (`BaseError`, `ValidationError`, `UnauthorizedError`)

**Dependencies**:
- `@phone-games/db`
- `@phone-games/games`
- `@phone-games/user`
- `@phone-games/party`
- `express`, `cors`, `firebase-admin`, `jsonwebtoken`

## Dependency Graph

```
                    ┌─────────┐
                    │   db    │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼────┐      ┌───▼────┐      ┌───▼────┐
    │ games  │      │  user  │      │ party  │
    └───┬────┘      └───┬────┘      └───┬────┘
        │               │                │
        └───────────────┼────────────────┘
                        │
                    ┌───▼────┐
                    │ server │
                    └────────┘
```

**Note**: Each package contains its own domain-specific error classes. There is no shared errors package.

## Adding a New Package

1. Create package directory: `packages/my-package/`
2. Add `package.json` with workspace dependencies
3. Add `tsconfig.json` with composite: true
4. Add references to dependent packages
5. Create `src/index.ts` with exports
6. Update consuming packages to add the new dependency
7. Run `pnpm install` at root
8. Build the package: `pnpm --filter @phone-games/my-package build`

## Build Order

Turborepo automatically handles build order based on dependencies:

1. `@phone-games/db` (no dependencies)
2. `@phone-games/games` (depends on db)
3. `@phone-games/user` (depends on db)
4. `@phone-games/party` (depends on db, games)
5. `@phone-games/server` (depends on all)

## Benefits of This Structure

✅ **Separation of Concerns**: Each package has a single responsibility
✅ **Reusability**: Services can be imported by multiple apps
✅ **Type Safety**: Full TypeScript support across packages
✅ **Testability**: Each package can be tested independently
✅ **Scalability**: Easy to add new apps or packages
✅ **Clear Dependencies**: Explicit dependency graph
