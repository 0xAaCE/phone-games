import { ValidGameNames } from '../interfaces/Game';
import { ImpostorGame } from '../games/ImpostorGame';
import { ValidationError } from '../errors';
import { GAME_NAMES } from '../constants/game';
import { Game } from '../games/Game';


export class GameFactory {
  // Overload signatures for specific game types
  static createGame(gameName: GAME_NAMES.IMPOSTOR): Game<GAME_NAMES.IMPOSTOR>;
  // General signature for when game name is not known at compile time
  static createGame<T extends ValidGameNames>(gameName: T): Game<T>;
  // Implementation
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