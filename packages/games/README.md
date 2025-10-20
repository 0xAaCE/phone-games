# @phone-games/games

Game logic and state management package for the phone-games platform.

## Overview

This package contains game interfaces, implementations, state management, and game factories. It provides a pluggable game system where new games can be added without modifying existing code.

## Supported Games

### Impostor
A social deduction game similar to Mafia/Werewolf where players try to identify the impostor among them.

**Features:**
- Role assignment (Impostor vs Regular players)
- Voting rounds
- Player elimination
- Win conditions for both teams

## Architecture

### Game Interface

All games implement the `IGame` interface:

```typescript
interface IGame<T extends ValidGameNames> {
  // Game lifecycle
  start(): void;
  finish(): void;

  // Round management
  nextRound(params: NextRoundParams<T>): NextRoundResult<T>;
  middleRoundAction(params: MiddleRoundActionParams<T>): MiddleRoundActionResult<T>;
  finishRound(params: FinishRoundParams<T>): FinishRoundResult<T>;

  // State
  getState(): GameState<T>;
  setState(state: GameState<T>): void;

  // Players
  addPlayer(player: GamePlayer): void;
  removePlayer(userId: string): void;
  getPlayers(): GamePlayer[];
}
```

### Game State

```typescript
interface GameState<T extends ValidGameNames> {
  currentRound: number;
  isFinished: boolean;
  winner?: string;
  players: GamePlayer[];
  customState: GameCustomState<T>;  // Game-specific state
}

interface GamePlayer {
  user: User;
  isManager: boolean;  // Party owner/host
}
```

## Usage

### Creating a Game

```typescript
import { GameFactory, GAME_NAMES } from '@phone-games/games';

// Create an Impostor game
const game = GameFactory.createGame(GAME_NAMES.IMPOSTOR);

// Add players
game.addPlayer({ user: player1, isManager: true });
game.addPlayer({ user: player2, isManager: false });
game.addPlayer({ user: player3, isManager: false });

// Start the game
game.start();
```

### Game Flow

```typescript
// 1. Start the game (assigns roles)
game.start();

// 2. Progress through rounds
const nextRoundResult = game.nextRound({ userId: managerId });
// Returns: round information, events, messages

// 3. Players take actions (e.g., voting)
const actionResult = game.middleRoundAction({
  votes: {
    'player1-id': 'player2-id',  // player1 votes for player2
    'player2-id': 'player3-id',
    'player3-id': 'player2-id'
  }
});

// 4. Finish the round (tally votes, eliminate player)
const finishResult = game.finishRound({});
// Returns: eliminated player, game state, messages

// 5. Check if game is finished
if (game.getState().isFinished) {
  console.log(`Winner: ${game.getState().winner}`);
}
```

### Getting Game State

```typescript
const state = game.getState();

console.log(`Round: ${state.currentRound}`);
console.log(`Players: ${state.players.length}`);
console.log(`Finished: ${state.isFinished}`);

// Access game-specific state
if (game.name === GAME_NAMES.IMPOSTOR) {
  const impostorState = state.customState as ImpostorCustomState;
  console.log(`Impostors: ${impostorState.impostors.length}`);
  console.log(`Regular players: ${impostorState.regularPlayers.length}`);
}
```

## Impostor Game

### Custom State

```typescript
interface ImpostorCustomState {
  impostors: string[];        // User IDs of impostors
  regularPlayers: string[];   // User IDs of regular players
  eliminatedPlayers: string[];// User IDs of eliminated players
  roles: Record<string, ImpostorRole>;  // User ID -> Role mapping
}

enum ImpostorRole {
  IMPOSTOR = 'impostor',
  REGULAR = 'regular'
}
```

### Round Flow

1. **Start**: Roles are randomly assigned
2. **Next Round**: Manager initiates new round
3. **Middle Round Action**: Players vote
4. **Finish Round**: Votes tallied, player eliminated
5. **Check Win Condition**:
   - Impostors win if they equal or outnumber regular players
   - Regular players win if all impostors are eliminated

### Example

```typescript
const game = GameFactory.createGame(GAME_NAMES.IMPOSTOR);

// Add 5 players
game.addPlayer({ user: user1, isManager: true });
game.addPlayer({ user: user2, isManager: false });
game.addPlayer({ user: user3, isManager: false });
game.addPlayer({ user: user4, isManager: false });
game.addPlayer({ user: user5, isManager: false });

// Start - assigns 1 impostor, 4 regular players
game.start();

// Round 1
game.nextRound({ userId: user1.id });

// Players vote
game.middleRoundAction({
  votes: {
    [user1.id]: user3.id,
    [user2.id]: user3.id,
    [user3.id]: user2.id,
    [user4.id]: user3.id,
    [user5.id]: user3.id
  }
});

// Finish round - user3 eliminated (3 votes)
const result = game.finishRound({});
console.log(result.eliminatedPlayer); // user3.id

// Check game state
if (game.getState().isFinished) {
  console.log(`Game over! Winner: ${game.getState().winner}`);
}
```

## Adding New Games

### 1. Define Interfaces

```typescript
// interfaces/myGame.ts
export interface MyGameCustomState {
  score: Record<string, number>;
  // ... other state
}

export interface MyGameNextRoundParams {
  // ... params
}

export interface MyGameNextRoundResult {
  // ... result
}

// Add to game.ts
export interface GamePossibleCustomStates {
  [GAME_NAMES.MY_GAME]: MyGameCustomState;
  // ... existing games
}
```

### 2. Implement Game

```typescript
// games/myGame.ts
export class MyGame implements IGame<typeof GAME_NAMES.MY_GAME> {
  private state: GameState<typeof GAME_NAMES.MY_GAME>;

  constructor() {
    this.state = {
      currentRound: 0,
      isFinished: false,
      players: [],
      customState: { score: {} }
    };
  }

  start(): void {
    // Initialize game
  }

  nextRound(params: MyGameNextRoundParams): MyGameNextRoundResult {
    // Progress round
  }

  // ... implement other methods
}
```

### 3. Register in Factory

```typescript
// factories/gameFactory.ts
export class GameFactory {
  static createGame<T extends ValidGameNames>(name: T): IGame<T> {
    switch (name) {
      case GAME_NAMES.IMPOSTOR:
        return new ImpostorGame() as IGame<T>;
      case GAME_NAMES.MY_GAME:
        return new MyGame() as IGame<T>;
      default:
        throw new Error(`Unknown game: ${name}`);
    }
  }
}
```

## Type Safety

The package uses TypeScript generics for type-safe game operations:

```typescript
// Type-safe: params and results match game type
const impostorGame: IGame<typeof GAME_NAMES.IMPOSTOR> = GameFactory.createGame(GAME_NAMES.IMPOSTOR);
const result: ImpostorNextRoundResult = impostorGame.nextRound(params);

// Compile error: wrong params type
impostorGame.nextRound(myGameParams); // ❌ Type error
```

## Validation

Games include built-in validation using Zod schemas:

```typescript
import { impostorNextRoundParamsSchema } from '@phone-games/games';

// Validate params
const validatedParams = impostorNextRoundParamsSchema.parse(rawParams);
```

## State Persistence

Game state is JSON-serializable for persistence:

```typescript
// Save state
const state = game.getState();
const json = JSON.stringify(state);
await storage.save(partyId, json);

// Restore state
const json = await storage.load(partyId);
const state = JSON.parse(json);
game.setState(state);
```

## Dependencies

- `@phone-games/db`: User types
- `zod`: Runtime validation schemas

## Related Packages

- `@phone-games/party`: Manages game sessions
- `@phone-games/messaging`: Triggers game actions via commands
- `@phone-games/notifications`: Sends game updates to players
