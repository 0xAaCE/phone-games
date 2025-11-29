# Phone Games - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Package Structure](#package-structure)
5. [Core Components](#core-components)
6. [Data Model](#data-model)
7. [Communication Flows](#communication-flows)
8. [Design Patterns](#design-patterns)
9. [External Integrations](#external-integrations)

---

## Overview

Phone Games is a multiplayer party game platform built as a **TypeScript monorepo**. It supports real-time gameplay through multiple communication channels including WebSocket, WhatsApp (via Meta Business API), and Twilio.

The platform currently features the **Impostor** game - a social deduction game where players receive words and must identify the impostor who received a different word.

### Key Features
- Multi-channel notifications (WebSocket, WhatsApp, Twilio)
- Real-time game state synchronization
- Multi-language support (English, Spanish)
- Firebase authentication
- QR code party joining

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Clients["Client Layer"]
        WEB["Web Client<br/>(React + Vite)"]
        WA["WhatsApp<br/>(Meta API)"]
        TW["Twilio<br/>(WhatsApp/SMS)"]
    end

    subgraph Server["Server Layer"]
        EXPRESS["Express.js Server"]
        WS["WebSocket Server"]
        AUTH["Firebase Auth<br/>Middleware"]
    end

    subgraph Core["Core Business Logic"]
        MSG["Messaging Package<br/>(Command Handling)"]
        PARTY["Party Package<br/>(Session Management)"]
        GAMES["Games Package<br/>(Game Logic)"]
        NOTIF["Notifications Package<br/>(Multi-channel)"]
        USER["User Package<br/>(User Service)"]
    end

    subgraph Data["Data Layer"]
        REPO["Repositories Package"]
        DB_PKG["DB Package<br/>(Prisma Client)"]
        PG[("PostgreSQL")]
    end

    subgraph External["External Services"]
        FB["Firebase"]
        META["Meta WhatsApp API"]
        TWILIO["Twilio API"]
    end

    WEB <-->|REST API| EXPRESS
    WEB <-->|Real-time| WS
    WA -->|Webhook| EXPRESS
    TW -->|Webhook| EXPRESS

    EXPRESS --> AUTH
    AUTH --> MSG
    AUTH --> PARTY

    MSG --> PARTY
    PARTY --> GAMES
    PARTY --> NOTIF
    PARTY --> USER

    NOTIF -->|WebSocket| WS
    NOTIF -->|API| META
    NOTIF -->|SDK| TWILIO

    USER --> REPO
    PARTY --> REPO
    REPO --> DB_PKG
    DB_PKG --> PG

    AUTH -.->|Verify| FB
```

---

## Technology Stack

```mermaid
mindmap
    root((Phone Games))
        Backend
            Node.js
            Express 5.x
            TypeScript
            Prisma ORM
            Pino Logger
        Frontend
            React 18
            Vite
            Firebase SDK
        Database
            PostgreSQL
        Infrastructure
            Turborepo
            pnpm Workspaces
        External Services
            Firebase Auth
            Meta WhatsApp API
            Twilio
```

### Stack Details

| Layer | Technology | Version |
|-------|-----------|---------|
| **Language** | TypeScript | 5.9.2 |
| **Runtime** | Node.js | Latest LTS |
| **Build System** | Turborepo | 2.5.8 |
| **Package Manager** | pnpm | 10.5.0 |
| **Web Framework** | Express | 5.1.0 |
| **ORM** | Prisma | 6.16.2 |
| **Frontend** | React | 18.3.1 |
| **Bundler** | Vite | 5.4.0 |
| **Logging** | Pino | 10.0.0 |
| **Validation** | Zod | 4.1.12 |

---

## Package Structure

```mermaid
graph TB
    subgraph Apps["Applications"]
        SERVER["apps/server<br/>Express API"]
        CLIENT["apps/client<br/>React Frontend"]
    end

    subgraph Packages["Shared Packages"]
        DB["@phone-games/db<br/>Prisma Client"]
        ERRORS["@phone-games/errors<br/>Error Types"]
        LOGGER["@phone-games/logger<br/>Pino Wrapper"]
        GAMES["@phone-games/games<br/>Game Logic"]
        REPOS["@phone-games/repositories<br/>Data Access"]
        USER["@phone-games/user<br/>User Service"]
        PARTY["@phone-games/party<br/>Party Management"]
        MSG["@phone-games/messaging<br/>Command Handling"]
        NOTIF["@phone-games/notifications<br/>Multi-channel"]
    end

    SERVER --> MSG
    SERVER --> PARTY
    SERVER --> USER
    SERVER --> NOTIF
    SERVER --> LOGGER

    CLIENT -.->|API| SERVER

    MSG --> PARTY
    MSG --> NOTIF
    MSG --> USER

    PARTY --> GAMES
    PARTY --> REPOS
    PARTY --> NOTIF

    USER --> REPOS
    USER --> ERRORS

    REPOS --> DB
    REPOS --> ERRORS

    NOTIF --> GAMES
    NOTIF --> LOGGER

    GAMES --> ERRORS

    classDef app fill:#e1f5fe,stroke:#01579b
    classDef pkg fill:#f3e5f5,stroke:#7b1fa2

    class SERVER,CLIENT app
    class DB,ERRORS,LOGGER,GAMES,REPOS,USER,PARTY,MSG,NOTIF pkg
```

### Package Responsibilities

| Package | Purpose |
|---------|---------|
| `@phone-games/db` | Prisma client generation and database schema |
| `@phone-games/errors` | Custom error classes for domain errors |
| `@phone-games/logger` | Structured logging with Pino |
| `@phone-games/games` | Game logic (Impostor game implementation) |
| `@phone-games/repositories` | Data access abstraction layer |
| `@phone-games/user` | User domain service |
| `@phone-games/party` | Party/session management and game orchestration |
| `@phone-games/messaging` | Inbound message parsing and command routing |
| `@phone-games/notifications` | Multi-channel notification delivery |

---

## Core Components

### Session Coordinator (Mediator Pattern)

The `SessionCoordinator` is the central orchestrator that coordinates all party and game operations.

```mermaid
classDiagram
    class SessionCoordinator {
        -partyService: PartyService
        -gameSessionManager: GameSessionManager
        -playerNotificationCoordinator: PlayerNotificationCoordinator
        +createParty(userId, partyName, gameName)
        +joinParty(userId, partyId)
        +leaveParty(userId)
        +startMatch(userId)
        +nextRound(userId)
        +middleRoundAction(userId, params)
        +finishRound(userId)
        +finishMatch(userId)
        +getGameState(userId)
    }

    class PartyService {
        +createParty(userId, partyName, gameName)
        +joinParty(userId, partyId)
        +leaveParty(userId)
        +getPartyIdForUser(userId)
        +getGamePlayers(partyId)
    }

    class GameSessionManager {
        -gameStateStorage: IGameStateStorage
        +initializeGame(partyId, gameName)
        +startGame(partyId, players)
        +nextRound(partyId)
        +middleRoundAction(partyId, params)
        +finishRound(partyId)
        +finishMatch(partyId)
        +getGameState(partyId)
    }

    class PlayerNotificationCoordinator {
        -partyService: PartyService
        -notificationManager: NotificationManager
        +notifyPartyPlayers(partyId, method, data)
    }

    SessionCoordinator --> PartyService
    SessionCoordinator --> GameSessionManager
    SessionCoordinator --> PlayerNotificationCoordinator
    PlayerNotificationCoordinator --> PartyService
```

### Notification System

```mermaid
classDiagram
    class NotificationManager {
        -providers: Map~string, NotificationProvider~
        -formatters: Map~string, GameFormatter~
        +registerUser(userId, provider)
        +unregisterUser(userId)
        +notifyStartMatch(userId, game, state)
        +notifyNextRound(userId, game, state)
        +notifyVote(userId, game, state)
        +notifyFinishRound(userId, game, state)
        +notifyFinishMatch(userId, game, state)
        +notifyError(userId, error)
    }

    class NotificationProvider {
        <<interface>>
        +sendNotification(message)
        +getType() string
    }

    class WebSocketNotificationProvider {
        -socket: WebSocket
        +sendNotification(message)
        +getType() string
    }

    class WhatsappNotificationProvider {
        -apiUrl: string
        -phoneNumberId: string
        +sendNotification(message)
        +getType() string
    }

    class TwilioWhatsAppNotificationProvider {
        -client: TwilioClient
        +sendNotification(message)
        +getType() string
    }

    class GameFormatter {
        <<interface>>
        +formatStartMatch(state)
        +formatNextRound(state)
        +formatVote(state)
        +formatFinishRound(state)
        +formatFinishMatch(state)
    }

    NotificationProvider <|.. WebSocketNotificationProvider
    NotificationProvider <|.. WhatsappNotificationProvider
    NotificationProvider <|.. TwilioWhatsAppNotificationProvider

    NotificationManager --> NotificationProvider
    NotificationManager --> GameFormatter
```

### Game Architecture

```mermaid
classDiagram
    class Game~T~ {
        <<abstract>>
        #state: GameState~T~
        +start(players)* GameState~T~
        +nextRound()* NextRoundResult~T~
        +middleRoundAction(params)* MiddleRoundResult~T~
        +finishRound()* FinishRoundResult~T~
        +finishMatch()* FinishMatchResult~T~
        +getGameState() GameState~T~
    }

    class ImpostorGame {
        -wordGenerator: WordGenerator
        -language: string
        +start(players) GameState
        +nextRound() NextRoundResult
        +middleRoundAction(params) VoteResult
        +finishRound() FinishRoundResult
        +finishMatch() FinishMatchResult
    }

    class GameState~T~ {
        +gameName: string
        +status: GameStatus
        +players: GamePlayer[]
        +currentRound: number
        +customState: T
    }

    class ImpostorCustomState {
        +word: string
        +impostorWord: string
        +impostorId: string
        +votes: Map~string, string~
        +roundHistory: RoundHistory[]
    }

    class GameFactory {
        +createGame(gameName) Game
    }

    Game <|-- ImpostorGame
    Game --> GameState
    GameState --> ImpostorCustomState : T = ImpostorCustomState
    GameFactory --> Game : creates
```

### Command System

```mermaid
classDiagram
    class GameCommand {
        <<interface>>
        +execute() Promise~void~
        +validate() Promise~void~
    }

    class GameCommandFactory {
        -commands: GameCommand[]
        +createCommand(text, userId, sessionCoordinator) GameCommand
        +canHandle(text) boolean
    }

    class CreatePartyCommand {
        +static canHandle(text) boolean
        +static parseParams(text) CreateParams
        +execute() Promise~void~
    }

    class JoinPartyCommand {
        +static canHandle(text) boolean
        +static parseParams(text) JoinParams
        +execute() Promise~void~
    }

    class StartMatchCommand {
        +static canHandle(text) boolean
        +execute() Promise~void~
    }

    class NextRoundCommand {
        +static canHandle(text) boolean
        +execute() Promise~void~
    }

    class VoteCommand {
        +static canHandle(text) boolean
        +static parseParams(text) VoteParams
        +execute() Promise~void~
    }

    GameCommand <|.. CreatePartyCommand
    GameCommand <|.. JoinPartyCommand
    GameCommand <|.. StartMatchCommand
    GameCommand <|.. NextRoundCommand
    GameCommand <|.. VoteCommand

    GameCommandFactory --> GameCommand : creates
```

---

## Data Model

```mermaid
erDiagram
    USER {
        string id PK
        string username
        string email UK
        string phoneNumber UK
        datetime createdAt
    }

    PARTY {
        string id PK
        string partyName
        string gameName
        enum status
        datetime createdAt
        datetime updatedAt
    }

    PARTY_PLAYER {
        string id PK
        string partyId FK
        string userId FK
        enum role
        datetime joinedAt
    }

    USER ||--o{ PARTY_PLAYER : "participates in"
    PARTY ||--o{ PARTY_PLAYER : "has"
```

### Enums

```mermaid
classDiagram
    class PartyStatus {
        <<enumeration>>
        WAITING
        ACTIVE
        FINISHED
    }

    class PlayerRole {
        <<enumeration>>
        MANAGER
        PLAYER
    }

    class GameStatus {
        <<enumeration>>
        NOT_STARTED
        IN_PROGRESS
        ROUND_ENDED
        FINISHED
    }
```

---

## Communication Flows

### WhatsApp Message Processing

```mermaid
sequenceDiagram
    autonumber
    participant WA as WhatsApp
    participant WH as Webhook Controller
    participant Parser as WhatsAppParser
    participant MH as MessageHandler
    participant URS as UserRegistrationService
    participant CF as CommandFactory
    participant CMD as GameCommand
    participant SC as SessionCoordinator
    participant NM as NotificationManager

    WA->>WH: POST /api/whatsapp (webhook)
    WH->>Parser: parse(rawMessage)
    Parser-->>WH: ParsedMessage
    WH->>MH: handle(platform, message)

    MH->>URS: ensureUserRegistered(parsedMessage)
    URS-->>MH: User (created or existing)

    MH->>CF: createCommand(text, userId)
    CF-->>MH: GameCommand

    MH->>CMD: validate()
    MH->>CMD: execute()
    CMD->>SC: startMatch() / nextRound() / etc.

    SC->>NM: notifyPartyPlayers()
    NM->>WA: Send WhatsApp messages

    MH-->>WH: Success
    WH-->>WA: 200 OK
```

### WebSocket Real-time Communication

```mermaid
sequenceDiagram
    autonumber
    participant Client as Web Client
    participant WSM as WebSocketManager
    participant Auth as Firebase Auth
    participant NM as NotificationManager
    participant SC as SessionCoordinator

    Client->>WSM: Connect ws://server/ws?token=xxx
    WSM->>Auth: verifyToken(token)
    Auth-->>WSM: userId

    WSM->>NM: registerUser(userId, WebSocketProvider)
    NM-->>WSM: registered
    WSM-->>Client: Connection established

    Note over Client,SC: User performs game action via REST API

    Client->>SC: POST /api/parties/game/next-round
    SC->>SC: Process game logic
    SC->>NM: notifyPartyPlayers(nextRound, state)

    loop For each player
        NM->>WSM: sendNotification(userId, message)
        WSM->>Client: WebSocket message
    end

    Client->>Client: Update UI with new state
```

### Party Creation and Game Start

```mermaid
sequenceDiagram
    autonumber
    participant User as User
    participant API as REST API
    participant PS as PartyService
    participant GSM as GameSessionManager
    participant GF as GameFactory
    participant Game as ImpostorGame
    participant NM as NotificationManager

    User->>API: POST /api/parties {name, game}
    API->>PS: createParty(userId, name, game)
    PS->>PS: Create Party in DB
    PS->>PS: Create PartyPlayer (MANAGER role)
    PS-->>API: Party created

    Note over User,NM: Other users join party...

    User->>API: POST /api/parties/start
    API->>PS: getPartyIdForUser(userId)
    API->>PS: getGamePlayers(partyId)

    API->>GSM: initializeGame(partyId, gameName)
    GSM->>GF: createGame(gameName)
    GF-->>GSM: ImpostorGame instance

    API->>GSM: startGame(partyId, players)
    GSM->>Game: start(players)
    Game->>Game: Assign roles (impostor/citizen)
    Game->>Game: Generate words
    Game-->>GSM: GameState

    GSM->>NM: notifyPartyPlayers(startMatch, state)

    loop For each player
        NM->>NM: Format message (per channel)
        NM->>NM: Send via provider
    end

    API-->>User: 200 OK {gameState}
```

### Impostor Game Round Flow

```mermaid
sequenceDiagram
    autonumber
    participant M as Manager
    participant P as Players
    participant SC as SessionCoordinator
    participant GSM as GameSessionManager
    participant Game as ImpostorGame
    participant NM as NotificationManager

    Note over M,NM: Game is ACTIVE, round in progress

    M->>SC: nextRound()
    SC->>GSM: nextRound(partyId)
    GSM->>Game: nextRound()
    Game->>Game: Reset votes
    Game->>Game: Generate new words
    Game-->>GSM: NextRoundResult
    GSM-->>SC: GameState
    SC->>NM: notifyPartyPlayers(nextRound)
    NM->>P: "New round! Your word is: X"

    Note over M,NM: Voting phase

    loop Each player votes
        P->>SC: middleRoundAction({votedFor: playerId})
        SC->>GSM: middleRoundAction(partyId, params)
        GSM->>Game: middleRoundAction(params)
        Game->>Game: Record vote
        Game-->>GSM: VoteResult
        SC->>NM: notifyPartyPlayers(vote)
        NM->>P: "Player X voted!"
    end

    Note over M,NM: Finish round

    M->>SC: finishRound()
    SC->>GSM: finishRound(partyId)
    GSM->>Game: finishRound()
    Game->>Game: Tally votes
    Game->>Game: Determine if impostor caught
    Game-->>GSM: FinishRoundResult
    SC->>NM: notifyPartyPlayers(finishRound)
    NM->>P: "Round over! Impostor was: X"
```

### User Registration Flow (Messaging Platforms)

```mermaid
sequenceDiagram
    autonumber
    participant Platform as WhatsApp/Twilio
    participant MH as MessageHandler
    participant URS as UserRegistrationService
    participant US as UserService
    participant Repo as UserRepository
    participant NM as NotificationManager

    Platform->>MH: Incoming message
    MH->>URS: ensureUserRegistered(parsedMessage)

    URS->>US: getUserByPhone(phoneNumber)

    alt User exists
        US->>Repo: findByPhone(phoneNumber)
        Repo-->>US: User
        US-->>URS: User
    else User doesn't exist
        URS->>US: createUser({phone, username})
        US->>Repo: create(userData)
        Repo-->>US: New User
        US-->>URS: New User
    end

    URS->>NM: registerUser(userId, provider)
    Note over URS,NM: Provider based on platform<br/>(WhatsApp or Twilio)

    URS-->>MH: User (with notification setup)
```

---

## Design Patterns

```mermaid
mindmap
    root((Design Patterns))
        Creational
            Factory
                GameFactory
                GameCommandFactory
        Structural
            Decorator
                retryNotificationProvider
        Behavioral
            Mediator
                SessionCoordinator
            Command
                GameCommand classes
            Strategy
                NotificationProvider
                Parser
                Formatter
            Template Method
                Game base class
                BaseImpostorFormatter
            Chain of Responsibility
                Command matching
        Architectural
            Repository
                IUserRepository
                IPartyRepository
            Dependency Injection
                ServiceFactory
```

### Pattern Implementations

| Pattern | Implementation | Purpose |
|---------|----------------|---------|
| **Mediator** | `SessionCoordinator` | Orchestrates party, game, and notification services |
| **Factory** | `GameFactory`, `GameCommandFactory` | Creates games and commands dynamically |
| **Template Method** | `Game`, `BaseImpostorFormatter` | Define algorithm structure with customizable steps |
| **Strategy** | `NotificationProvider`, `Parser` | Interchangeable implementations |
| **Command** | `GameCommand` hierarchy | Encapsulate game actions |
| **Repository** | `IUserRepository`, `IPartyRepository` | Abstract data access |
| **Decorator** | `retryNotificationProvider` | Add retry logic transparently |

---

## External Integrations

### Integration Architecture

```mermaid
flowchart LR
    subgraph App["Phone Games"]
        NM["NotificationManager"]
        AUTH["Auth Middleware"]
        PARSER["Message Parsers"]
    end

    subgraph Meta["Meta Platform"]
        WA_API["WhatsApp<br/>Business API"]
        WA_WH["Webhook"]
    end

    subgraph Twilio["Twilio Platform"]
        TW_API["Twilio API"]
        TW_WH["Webhook"]
    end

    subgraph Firebase["Firebase"]
        FB_AUTH["Authentication"]
        FB_ADMIN["Admin SDK"]
    end

    subgraph Database["Database"]
        PG[("PostgreSQL")]
        PRISMA["Prisma Client"]
    end

    NM -->|Send Messages| WA_API
    NM -->|Send Messages| TW_API

    WA_WH -->|Incoming| PARSER
    TW_WH -->|Incoming| PARSER

    AUTH -->|Verify Token| FB_ADMIN
    AUTH -.->|ID Token| FB_AUTH

    PRISMA -->|Queries| PG
```

### Meta WhatsApp Business API

```mermaid
sequenceDiagram
    participant App as Phone Games
    participant Meta as Meta WhatsApp API

    Note over App,Meta: Sending a message
    App->>Meta: POST /{phoneNumberId}/messages
    Note right of App: Headers:<br/>Authorization: Bearer {token}
    Note right of App: Body:<br/>{"messaging_product": "whatsapp",<br/>"to": "phone",<br/>"type": "text",<br/>"text": {"body": "..."}}
    Meta-->>App: 200 OK {message_id}

    Note over App,Meta: Receiving a message (Webhook)
    Meta->>App: POST /api/whatsapp
    Note right of Meta: Body: {<br/>  "entry": [{<br/>    "changes": [{<br/>      "value": {<br/>        "messages": [...]<br/>      }<br/>    }]<br/>  }]<br/>}
    App-->>Meta: 200 OK
```

### Firebase Authentication

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant FB as Firebase
    participant Server as Express Server
    participant Admin as Firebase Admin

    Client->>FB: signInWithEmailAndPassword()
    FB-->>Client: User + ID Token

    Client->>Server: Request with Authorization header
    Note right of Client: Authorization: Bearer {idToken}

    Server->>Admin: verifyIdToken(token)
    Admin->>FB: Verify token
    FB-->>Admin: Decoded token
    Admin-->>Server: {uid, email, ...}

    Server->>Server: Attach user to request
    Server-->>Client: Protected resource
```

---

## Deployment Overview

```mermaid
flowchart TB
    subgraph Client["Client Deployment"]
        VITE["Vite Build"]
        STATIC["Static Assets"]
        CDN["CDN / Static Host"]
    end

    subgraph Server["Server Deployment"]
        NODE["Node.js Process"]
        EXPRESS["Express Server<br/>:4000"]
        WS_SERVER["WebSocket Server<br/>:4000/ws"]
    end

    subgraph Database["Database"]
        PG[("PostgreSQL")]
    end

    subgraph External["External Services"]
        FB["Firebase"]
        META["Meta WhatsApp"]
        TW["Twilio"]
    end

    VITE --> STATIC
    STATIC --> CDN
    CDN -->|API Calls| EXPRESS
    CDN -->|WebSocket| WS_SERVER

    EXPRESS --> PG
    EXPRESS --> FB
    EXPRESS --> META
    EXPRESS --> TW

    WS_SERVER --> EXPRESS
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: 4000) |
| `NODE_ENV` | Environment (development/production) |
| `PUBLIC_URL` | Server URL for QR codes |
| `WHATSAPP_API_URL` | Meta API endpoint |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta phone number ID |
| `WHATSAPP_API_TOKEN` | Meta API token |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email |
| `JWT_SECRET` | JWT signing secret |

---

## API Reference

### REST Endpoints Summary

```mermaid
flowchart LR
    subgraph Users["/api/users"]
        U1["POST / - Create user"]
        U2["POST /auth/firebase - Firebase auth"]
        U3["GET /:id - Get user"]
        U4["PUT /:id - Update user"]
        U5["DELETE /:id - Delete user"]
    end

    subgraph Parties["/api/parties"]
        P1["POST / - Create party"]
        P2["GET /my-party - Current party"]
        P3["POST /join - Join party"]
        P4["POST /leave - Leave party"]
        P5["POST /start - Start match"]
    end

    subgraph Game["/api/parties/game"]
        G1["POST /next-round"]
        G2["POST /middle-round-action"]
        G3["POST /finish-round"]
        G4["POST /finish-match"]
        G5["GET /state"]
    end

    subgraph Webhooks["Webhooks"]
        W1["POST /api/whatsapp"]
        W2["POST /api/twilio"]
    end

    subgraph Other["Other"]
        O1["GET /api/qr/:partyId"]
        O2["GET /health"]
    end
```

---

## Future Considerations

1. **Scalability**: Game state currently stored in-memory; consider Redis for horizontal scaling
2. **New Games**: Architecture supports adding new games via `GameFactory`
3. **New Channels**: Add notification providers by implementing `NotificationProvider` interface
4. **Analytics**: Consider adding event tracking for game statistics
5. **Rate Limiting**: Add rate limiting for webhook endpoints
