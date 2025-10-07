# Monorepo Setup Documentation

## Structure

```
phone_games/
├── apps/
│   └── server/           # Express API server
├── packages/
│   ├── db/              # Database package (Prisma)
│   └── games/           # Games logic package
├── docs/                # Documentation
├── turbo.json          # Turborepo configuration
├── pnpm-workspace.yaml # PNPM workspace configuration
└── package.json        # Root package.json
```

## Packages

### `@phone-games/db`
- **Location**: `packages/db`
- **Purpose**: Database schema and Prisma client
- **Exports**: Prisma Client, all generated types, and `db` instance
- **Key Scripts**:
  - `pnpm db:generate` - Generate Prisma client
  - `pnpm db:push` - Push schema to database
  - `pnpm db:migrate` - Run migrations
  - `pnpm build` - Build package

### `@phone-games/games`
- **Location**: `packages/games`
- **Purpose**: Game interfaces, implementations, and factory
- **Exports**: All game-related interfaces, classes, and constants
- **Dependencies**: `@phone-games/db`
- **Key Scripts**:
  - `pnpm build` - Build package
  - `pnpm typecheck` - Type check without building

### `@phone-games/server`
- **Location**: `apps/server`
- **Purpose**: Express REST API server
- **Dependencies**: `@phone-games/db`, `@phone-games/games`
- **Key Scripts**:
  - `pnpm dev` - Run development server
  - `pnpm build` - Build for production
  - `pnpm start` - Start production server

## Development Workflow

### Initial Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Build all packages
pnpm build
```

### Development

```bash
# Run development server (from root)
pnpm dev

# Or run specific package
pnpm --filter @phone-games/server dev
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @phone-games/db build
```

### Type Checking

```bash
# Type check all packages
pnpm typecheck
```

## Key Configuration

### TypeScript Project References
- All packages use TypeScript composite projects
- Server references both `db` and `games` packages
- Games package references `db` package

### Package Exports
Packages use the `exports` field in package.json to point to source files for development:

```json
{
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  }
}
```

### Turborepo Pipeline
The build pipeline ensures proper dependency order:
- `db` builds first
- `games` builds after `db` (depends on `^build`)
- `server` builds after both packages

## Adding a New Game

1. Create interface in `packages/games/src/interfaces/YourGame.ts`
2. Add to `CustomStates` in `packages/games/src/interfaces/Game.ts`
3. Create implementation in `packages/games/src/games/YourGame.ts`
4. Add constant in `packages/games/src/constants/game.ts`
5. Add case in `GameFactory.createGame()` switch statement
6. Export from `packages/games/src/index.ts`

## Common Commands

```bash
# Install new dependency in a specific package
pnpm --filter @phone-games/server add express

# Remove dependency
pnpm --filter @phone-games/server remove express

# Run command in all packages
pnpm -r <command>

# Clean all dist folders
pnpm clean
```

## Troubleshooting

### "Cannot find module '@phone-games/db'"
- Ensure you've run `pnpm install`
- Run `pnpm db:generate` to create Prisma client
- Run `pnpm build` to build the db package

### Type errors in games package
- Ensure db package is built: `pnpm --filter @phone-games/db build`
- Check that TypeScript project references are configured correctly

### Prisma client not found
- Run `pnpm db:generate` from root or `packages/db`
- Ensure the generated folder exists in `packages/db/src/generated`
