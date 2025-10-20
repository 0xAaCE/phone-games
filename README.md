# Phone Games Platform

A multiplayer game platform that enables users to play social deduction games through messaging platforms (WhatsApp, Twilio) or web interface.

## Overview

Phone Games is a monorepo-based platform built with TypeScript, featuring a modular architecture with clean separation of concerns. Users can create game parties, invite friends via messaging apps, and play games like Impostor (similar to Mafia/Among Us) directly through chat or a web interface.

## Features

- **Multi-Platform Support**: Play via WhatsApp, Twilio, or web browser
- **Social Deduction Games**: Impostor game with role assignment and voting
- **Real-Time Notifications**: WebSocket and messaging platform integration
- **Type-Safe**: Full TypeScript support across all packages
- **Modular Architecture**: Clean separation with design patterns
- **Scalable**: Monorepo structure with Turborepo for fast builds

## Tech Stack

### Core
- **TypeScript**: Type safety across all packages
- **Node.js**: Runtime environment
- **pnpm**: Package manager with workspaces
- **Turborepo**: Monorepo build system

### Backend
- **Express.js**: Web server and API
- **Prisma**: ORM for PostgreSQL
- **Pino**: High-performance JSON logging
- **WebSocket**: Real-time communication

### Frontend
- **React 18**: UI library
- **Vite**: Build tool and dev server
- **Firebase**: Optional authentication

### External Services
- **Meta WhatsApp Business API**: WhatsApp messaging
- **Twilio**: Alternative WhatsApp messaging
- **PostgreSQL**: Primary database

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Phone Games Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   WhatsApp   │         │    Twilio    │                  │
│  │   Webhook    │         │   Webhook    │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         └────────────┬───────────┘                           │
│                      ▼                                       │
│         ┌─────────────────────────┐                         │
│         │  MessageHandlerService  │                         │
│         │  (Command Pattern)      │                         │
│         └────────┬────────────────┘                         │
│                  │                                           │
│                  ▼                                           │
│         ┌─────────────────────────┐                         │
│         │  PartyManagerService    │                         │
│         │  (Mediator Pattern)     │                         │
│         └────────┬────────────────┘                         │
│                  │                                           │
│         ┌────────┴────────┬────────────┐                    │
│         ▼                 ▼            ▼                     │
│   ┌──────────┐    ┌────────────┐  ┌─────────────┐          │
│   │  Party   │    │   Game     │  │Notification │          │
│   │ Service  │    │  Session   │  │ Coordinator │          │
│   └──────────┘    │  Manager   │  └─────────────┘          │
│                   └────────────┘                            │
│                                                              │
│   ┌──────────────────────────────────────────────┐          │
│   │           Shared Packages                    │          │
│   │  • Games  • User  • Repositories             │          │
│   │  • Notifications  • DB  • Errors  • Logger   │          │
│   └──────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

## Project Structure

```
phone-games-monorepo/
├── apps/
│   ├── server/              # Express.js backend server
│   └── client/              # React frontend application
├── packages/
│   ├── db/                  # Prisma database layer
│   ├── errors/              # Centralized error types
│   ├── games/               # Game logic and interfaces
│   ├── logger/              # Structured logging (Pino)
│   ├── messaging/           # Message parsing and commands
│   ├── notifications/       # Multi-platform notifications
│   ├── party/               # Party and game session management
│   ├── repositories/        # Repository Pattern implementations
│   └── user/                # User management service
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Design Patterns

This project extensively uses design patterns for maintainability and scalability:

### 1. Command Pattern (`@phone-games/messaging`)
- Encapsulates game actions as command objects
- Each command handles its own validation and execution
- Easy to add new commands without modifying existing code

**Example:** `CreatePartyCommand`, `JoinPartyCommand`, `StartMatchCommand`

### 2. Chain of Responsibility (`@phone-games/messaging`)
- Commands are matched sequentially via static `canHandle()` methods
- Factory iterates through registered commands to find a match
- No switch statements or long if/else chains

### 3. Mediator Pattern (`@phone-games/party`)
- `PartyManagerService` coordinates between services
- Prevents tight coupling between Party, Game, and Notification services
- Centralizes control flow and communication

### 4. Repository Pattern (`@phone-games/repositories`)
- Abstracts data access layer from business logic
- Services depend on interfaces, not implementations
- Easy to swap implementations (Prisma → TypeORM)

### 5. Strategy Pattern (`@phone-games/notifications`)
- Different notification strategies per platform (WhatsApp, Twilio, WebSocket)
- Providers are interchangeable
- Add new platforms without modifying existing code

### 6. Decorator Pattern (`@phone-games/notifications`)
- `RetryNotificationProvider` wraps providers with retry logic
- Adds behavior without modifying original provider
- Can stack multiple decorators

### 7. Template Method Pattern (`@phone-games/notifications`)
- `BaseImpostorFormatter` defines message structure
- Subclasses implement platform-specific formatting
- Ensures consistency across platforms

### 8. Factory Pattern (`@phone-games/games`)
- `GameFactory` creates game instances
- Hides instantiation complexity
- Type-safe game creation

## Packages

### Infrastructure

| Package | Description | Key Features |
|---------|-------------|--------------|
| [`@phone-games/db`](./packages/db) | Database layer with Prisma | Type-safe queries, migrations, PostgreSQL |
| [`@phone-games/errors`](./packages/errors) | Centralized error types | HTTP errors, domain errors, error utilities |
| [`@phone-games/logger`](./packages/logger) | Structured logging | Pino-based, child loggers, JSON output |
| [`@phone-games/repositories`](./packages/repositories) | Repository Pattern | User/Party repositories, testable abstractions |

### Core Logic

| Package | Description | Key Features |
|---------|-------------|--------------|
| [`@phone-games/games`](./packages/games) | Game logic and state | Impostor game, pluggable games, state management |
| [`@phone-games/user`](./packages/user) | User management | CRUD operations, phone number validation |
| [`@phone-games/party`](./packages/party) | Party coordination | Mediator pattern, game sessions, player management |
| [`@phone-games/messaging`](./packages/messaging) | Message handling | Command pattern, parsers, webhook processing |
| [`@phone-games/notifications`](./packages/notifications) | Multi-platform notifications | WhatsApp, Twilio, WebSocket, retry logic |

### Applications

| App | Description | Tech Stack |
|-----|-------------|-----------|
| [`apps/server`](./apps/server) | Backend API server | Express, webhooks, service factory |
| [`apps/client`](./apps/client) | Frontend web app | React, Vite, TypeScript, Firebase |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- PostgreSQL 15+
- (Optional) WhatsApp Business API credentials
- (Optional) Twilio account

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/phone-games.git
cd phone-games

# Install dependencies
pnpm install

# Setup database
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Or start individually:
pnpm --filter @phone-games/server dev    # Server on :3000
pnpm --filter @phone-games/client dev    # Client on :5173
```

### Build

```bash
# Build all packages
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test

# Lint
pnpm lint
```

## Environment Variables

### Server (`apps/server/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/phone_games

# WhatsApp (Meta Business API)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_API_TOKEN=your-api-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Client (`apps/client/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Usage Example

### Via WhatsApp

```
User: /create_party impostor MyParty
Bot:  ✅ Party created! ID: abc-123
      Share this ID with friends to join.

User2: /join_party abc-123
Bot:   ✅ You joined "MyParty"

User: /start_match
Bot:  🎮 Game Started!
      Your Role: IMPOSTOR
      Deceive others without being caught!

Bot:  🔄 Round 1
      Discussion phase. Vote for who you think is the impostor.

User2: /vote User
Bot:   ✅ Vote recorded

User: /finish_round
Bot:  ⚠️ User was eliminated! (Regular Player)
      Game continues...
```

### Via Commands

All available commands:

- `/create_party <game> <name>` or `/cp` - Create new party
- `/join_party <id>` or `/jp` - Join existing party
- `/leave_party` or `/lp` - Leave current party
- `/start_match` or `/sm` - Start the game
- `/next_round` or `/nr` - Progress to next round
- `/vote <username>` - Vote to eliminate player
- `/finish_round` or `/fr` - End current round
- `/finish_match` or `/fm` - End the match

## Architecture Highlights

### Message Flow

```mermaid
sequenceDiagram
    participant User as User<br/>(WhatsApp)
    participant Webhook as Server<br/>Webhook
    participant Parser as Message<br/>Parser
    participant Factory as Command<br/>Factory
    participant Command as Game<br/>Command
    participant Party as Party<br/>Manager
    participant Game as Game<br/>Session
    participant Notif as Notification<br/>Service

    User->>Webhook: "/create_party impostor MyParty"
    Webhook->>Parser: parse(message)
    Parser-->>Webhook: { text, user }
    Webhook->>Factory: createCommand(text, userId)
    Factory-->>Webhook: CreatePartyCommand
    Webhook->>Command: execute()
    Command->>Party: createParty(userId, name, game)
    Party->>Game: createSession(partyId, game)
    Party->>Notif: notifyPartyMembers(...)
    Notif->>User: "✅ Party created!"
```

### Package Dependencies

```
┌─────────────┐
│   server    │
└──────┬──────┘
       │
       ├──────► messaging ──────► user
       │           │
       │           └──────► party ──────► games
       │                      │
       │                      └──────► notifications
       │
       ├──────► repositories ──────► db
       │
       └──────► logger, errors
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @phone-games/messaging test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Type checking
pnpm typecheck
```

## Deployment

### Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Kubernetes

See [`apps/server/README.md`](./apps/server/README.md) for Kubernetes manifests.

### CI/CD

The project uses Turborepo's caching for fast CI builds:

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build
  run: pnpm build

- name: Test
  run: pnpm test

- name: Lint
  run: pnpm lint
```

## Performance

- **Turborepo Caching**: Builds are cached locally and remotely
- **Parallel Builds**: Packages build concurrently
- **Incremental TypeScript**: Only rebuilds changed files
- **Pino Logging**: Minimal overhead structured logging
- **Prisma**: Optimized database queries

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Follow existing design patterns
- Use conventional commits

## Scripts

From monorepo root:

```bash
# Development
pnpm dev                    # Start all apps in dev mode
pnpm dev --filter server    # Start only server
pnpm dev --filter client    # Start only client

# Building
pnpm build                  # Build all packages
pnpm build --filter server  # Build only server

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run migrations
pnpm db:push                # Push schema (dev)

# Quality
pnpm lint                   # Lint all packages
pnpm lint:fix               # Fix linting issues
pnpm typecheck              # Type check all packages

# Cleanup
pnpm clean                  # Clean build artifacts
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL

# Reset database (development)
pnpm db:push --force-reset
```

### Build Failures

```bash
# Clear Turborepo cache
rm -rf node_modules/.cache/turbo

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Clean and rebuild
pnpm clean
pnpm build
```

### Webhook Issues

- Verify webhook URLs are publicly accessible (use ngrok for local development)
- Check webhook verification tokens match
- Review logs for parsing errors
- Confirm environment variables are set

## License

MIT

## Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## Acknowledgments

- Built with ❤️ using TypeScript
- Design patterns inspired by Gang of Four
- Game logic based on Mafia/Werewolf/Among Us

---

**⭐ Star this repo if you find it useful!**
