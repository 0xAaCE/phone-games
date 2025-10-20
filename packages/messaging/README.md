# @phone-games/messaging

Message handling package for the phone-games platform. Processes incoming messages from multiple messaging platforms (WhatsApp, Twilio) and executes game commands using Command Pattern and Chain of Responsibility.

## Architecture

This package implements several design patterns for clean, maintainable message processing:

- **Command Pattern**: Each game action is encapsulated as a command object
- **Chain of Responsibility**: Commands are registered and matched sequentially
- **Strategy Pattern**: Different parsers for different messaging platforms
- **Factory Pattern**: GameCommandFactory creates appropriate command instances

## Key Components

### Parsers
Platform-specific message parsers that extract text and user information from incoming messages.

- `WhatsAppParser`: Handles Meta WhatsApp Business API format
- `TwilioParser`: Handles Twilio WhatsApp format

Parsers have a **single responsibility**: Extract platform-specific data (text + user info). They don't parse commands or match actions.

### Commands
Self-contained command classes that handle specific game actions.

Each command owns:
- Regex patterns for matching (with aliases)
- Parameter parsing logic
- Validation rules
- Execution logic

Available commands:
- `CreatePartyCommand`: Create a new party
- `JoinPartyCommand`: Join an existing party
- `LeavePartyCommand`: Leave current party
- `StartMatchCommand`: Start a match in the party
- `NextRoundCommand`: Progress to next round
- `MiddleRoundActionCommand`: Perform in-game actions (voting, etc.)
- `FinishRoundCommand`: End the current round
- `FinishMatchCommand`: End the match

### Factory
`GameCommandFactory` uses Chain of Responsibility to find the matching command and instantiate it with parsed parameters.

### Message Handler
`MessageHandlerService` orchestrates the entire flow: parse → user registration → command execution.

## Class Diagram

```mermaid
classDiagram
    %% Core Interfaces
    class IncomingMessageParser {
        <<interface>>
        +parse(message) Promise~Output~
        +getMessagePlatform() MessagePlatform
    }

    class GameCommand {
        <<interface>>
        +validate() Promise~boolean~
        +execute() Promise~void~
    }

    class GameCommandClass {
        <<interface>>
        +patterns: RegExp[]
        +canHandle(text: string) boolean
        +parseParams(text: string, context?) TParams
        +getAction() ValidActions
    }

    %% Parsers
    class WhatsAppParser {
        +parse(message) Promise~Output~
        +getMessagePlatform() MessagePlatform
    }

    class TwilioParser {
        +parse(message) Promise~Output~
        +getMessagePlatform() MessagePlatform
    }

    %% Commands
    class CreatePartyCommand {
        -partyManager: PartyManagerService
        -userId: string
        -params: CreatePartyParams
        +static patterns: RegExp[]
        +static canHandle(text) boolean
        +static parseParams(text) CreatePartyParams
        +static getAction() ValidActions
        +validate() Promise~boolean~
        +execute() Promise~void~
    }

    class JoinPartyCommand {
        -partyManager: PartyManagerService
        -userId: string
        -params: JoinPartyParams
        +static patterns: RegExp[]
        +static canHandle(text) boolean
        +static parseParams(text) JoinPartyParams
        +static getAction() ValidActions
        +validate() Promise~boolean~
        +execute() Promise~void~
    }

    class MiddleRoundActionCommand {
        -partyManager: PartyManagerService
        -userId: string
        -params: MiddleRoundActionParams
        +static patterns: RegExp[]
        +static canHandle(text) boolean
        +static parseParams(text, context) Promise~MiddleRoundActionParams~
        +static getAction() ValidActions
        +validate() Promise~boolean~
        +execute() Promise~void~
    }

    %% Factory
    class GameCommandFactory {
        -partyManager: PartyManagerService
        -userService: UserService
        -static commandClasses: GameCommandClass[]
        +createCommand(text, userId) Promise~GameCommand~
        +static getAllCommandClasses() GameCommandClass[]
    }

    %% Message Handler
    class MessageHandlerService {
        -userService: UserService
        -parsers: Map~MessagePlatform, IncomingMessageParser~
        -notificationService: NotificationService
        -commandFactory: GameCommandFactory
        -logger: ILogger
        +canHandle(platform, message) boolean
        +handle(platform, message) Promise~void~
        -handleUser(platform, output) Promise~User~
        -getMessageProvider(platform, user) NotificationProvider
    }

    %% Relationships
    IncomingMessageParser <|.. WhatsAppParser
    IncomingMessageParser <|.. TwilioParser

    GameCommand <|.. CreatePartyCommand
    GameCommand <|.. JoinPartyCommand
    GameCommand <|.. MiddleRoundActionCommand

    GameCommandClass <|.. CreatePartyCommand
    GameCommandClass <|.. JoinPartyCommand
    GameCommandClass <|.. MiddleRoundActionCommand

    GameCommandFactory --> GameCommandClass : uses static methods
    GameCommandFactory ..> GameCommand : creates

    MessageHandlerService --> IncomingMessageParser : uses
    MessageHandlerService --> GameCommandFactory : uses
    MessageHandlerService --> GameCommand : executes
```

## Sequence Diagram: Message Processing Flow

```mermaid
sequenceDiagram
    participant Client as External Platform<br/>(WhatsApp/Twilio)
    participant Handler as MessageHandlerService
    participant Parser as Parser<br/>(WhatsApp/Twilio)
    participant UserSvc as UserService
    participant NotificationSvc as NotificationService
    participant Factory as GameCommandFactory
    participant Command as GameCommand
    participant PartySvc as PartyManagerService

    Client->>Handler: POST /webhook (incoming message)

    rect rgb(230, 240, 255)
        Note over Handler,Parser: Phase 1: Parse Message
        Handler->>Handler: canHandle(platform, message)
        Handler->>Parser: parse(message)
        Parser->>Parser: Extract text from platform format
        Parser->>Parser: Extract user info (id, username, phone)
        Parser-->>Handler: { text, user }
    end

    rect rgb(255, 240, 230)
        Note over Handler,NotificationSvc: Phase 2: User Registration
        Handler->>UserSvc: getUserById(userId)
        alt User doesn't exist
            Handler->>UserSvc: createUser(userInfo)
        end

        alt User not registered with NotificationService
            Handler->>Handler: getMessageProvider(platform, user)
            Handler->>NotificationSvc: registerUser(userId, provider)
        end
    end

    rect rgb(230, 255, 240)
        Note over Handler,Command: Phase 3: Command Matching (Chain of Responsibility)
        Handler->>Factory: createCommand(text, userId)

        loop For each CommandClass in registry
            Factory->>Command: CommandClass.canHandle(text)
            alt Pattern matches
                Factory->>Command: CommandClass.parseParams(text, context)
                Command-->>Factory: params
                Factory->>Command: new CommandClass(partyManager, userId, params)
                Command-->>Factory: command instance
            end
        end

        Factory-->>Handler: command
    end

    rect rgb(255, 230, 240)
        Note over Handler,PartySvc: Phase 4: Command Execution
        Handler->>Command: validate() [optional]
        Command->>PartySvc: Check business rules
        PartySvc-->>Command: validation result

        Handler->>Command: execute()
        Command->>PartySvc: Perform game action
        PartySvc->>PartySvc: Update game state
        PartySvc->>NotificationSvc: Notify players
        NotificationSvc->>Client: Send notifications
        Command-->>Handler: success
    end

    Handler-->>Client: 200 OK
```

## Command Matching Flow

```mermaid
sequenceDiagram
    participant Factory as GameCommandFactory
    participant Create as CreatePartyCommand
    participant Join as JoinPartyCommand
    participant Leave as LeavePartyCommand
    participant Other as Other Commands...

    Note over Factory: text = "/create_party impostor MyParty"

    Factory->>Create: canHandle(text)
    Create->>Create: Check patterns:<br/>[/\/create_party/, /\/new_party/, /\/cp/]
    Create-->>Factory: true ✓

    Factory->>Create: parseParams(text, context)
    Create->>Create: Split text: ["", "impostor", "MyParty"]
    Create-->>Factory: { gameName: "impostor", partyName: "MyParty" }

    Factory->>Create: new CreatePartyCommand(partyManager, userId, params)
    Create-->>Factory: command instance

    Note over Factory,Create: Command ready for execution
```

## Usage Example

```typescript
import { MessageHandlerService } from '@phone-games/messaging';
import { WhatsAppParser, TwilioParser } from '@phone-games/messaging';

// Initialize parsers
const parsers = [
  new WhatsAppParser(),
  new TwilioParser()
];

// Create message handler
const messageHandler = new MessageHandlerService(
  notificationService,
  partyManagerService,
  userService,
  parsers,
  logger
);

// Handle incoming webhook
app.post('/webhook/:platform', async (req, res) => {
  const platform = req.params.platform; // 'whatsapp' or 'twilio'
  const message = req.body;

  if (messageHandler.canHandle(platform, message)) {
    await messageHandler.handle(platform, message);
    res.status(200).send('OK');
  } else {
    res.status(400).send('Cannot handle message');
  }
});
```

## Adding New Commands

To add a new command, create a class that implements both `GameCommand` and `GameCommandClass`:

```typescript
export class MyNewCommand implements GameCommand {
  // Static methods for matching and parsing
  static readonly patterns = [
    /\/my_command/,
    /\/mc/  // alias
  ];

  static canHandle(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }

  static parseParams(text: string): MyCommandParams {
    const [_action, param1, param2] = text.split(' ');
    return { param1, param2 };
  }

  static getAction(): ValidActions {
    return ValidActions.MY_ACTION;
  }

  // Instance methods for execution
  constructor(
    private partyManager: PartyManagerService,
    private userId: string,
    private params: MyCommandParams
  ) {}

  async validate(): Promise<boolean> {
    // Optional validation logic
    return true;
  }

  async execute(): Promise<void> {
    // Command execution logic
    await this.partyManager.doSomething(this.userId, this.params);
  }
}
```

Then register it in `GameCommandFactory`:

```typescript
private static readonly commandClasses: GameCommandClass[] = [
  CreatePartyCommand,
  JoinPartyCommand,
  // ... other commands
  MyNewCommand,  // Add your command here
];
```

## Design Benefits

### Single Responsibility Principle
- **Parsers**: Only extract platform-specific data
- **Commands**: Only handle specific game actions
- **Factory**: Only create appropriate command instances
- **Handler**: Only orchestrate the flow

### Open/Closed Principle
- Adding new commands doesn't require modifying existing code
- Just create a new command class and register it

### Testability
- Each component can be tested in isolation
- Commands can be tested without parsers
- Parsers can be tested without commands

### Maintainability
- Each command owns its own patterns and parsing logic
- No switch statements or long if/else chains
- Clear separation between platform abstraction and business logic

## Pattern Summary

| Pattern | Where | Why |
|---------|-------|-----|
| **Command Pattern** | Commands | Encapsulate game actions as objects with execute() |
| **Chain of Responsibility** | GameCommandFactory | Find matching command without switch statements |
| **Strategy Pattern** | Parsers | Different parsing strategies for different platforms |
| **Factory Pattern** | GameCommandFactory | Create command instances with dependencies |
| **Template Method** | Commands | Some commands have async parseParams with context |

## Dependencies

- `@phone-games/party`: Party and game management services
- `@phone-games/user`: User management services
- `@phone-games/notifications`: Notification providers
- `@phone-games/games`: Game interfaces and factories
- `@phone-games/errors`: Error types
- `@phone-games/logger`: Logging interface
