import { ValidGameNames } from '../interfaces/Game.js';
import { ImpostorGame } from '../games/ImpostorGame.js';
import { GAME_NAMES } from '../constants/game.js';
import { Game } from '../games/Game.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}


export class GameFactory {
  // Overload signatures for specific game types
  static createGame(gameName: GAME_NAMES.IMPOSTOR): Game<GAME_NAMES.IMPOSTOR>;
  // General signature for when game name is not known at compile time
  static createGame<T extends ValidGameNames>(gameName: T): Game<T>;
  // Implementation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createGame(gameName: ValidGameNames): Game<any> {
    switch (gameName) {
      case GAME_NAMES.IMPOSTOR:
        return new ImpostorGame();
      default:
        throw new ValidationError(`Game "${gameName}" not found. Available games: ${Object.values(GAME_NAMES).join(', ')}`);
    }
  }

  static getAvailableGames(): string[] {
    return Object.values(GAME_NAMES);
  }
}