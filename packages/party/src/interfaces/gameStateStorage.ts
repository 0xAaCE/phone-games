import { Game, ValidGameNames } from '@phone-games/games';

/**
 * Strategy interface for storing and retrieving game state.
 * Allows different storage implementations (in-memory, Redis, database).
 */
export interface IGameStateStorage {
  /**
   * Save a game instance.
   */
  save(partyId: string, game: Game<ValidGameNames>): Promise<void>;

  /**
   * Retrieve a game instance.
   */
  get(partyId: string): Promise<Game<ValidGameNames> | null>;

  /**
   * Delete a game instance.
   */
  delete(partyId: string): Promise<void>;

  /**
   * Check if a game exists.
   */
  has(partyId: string): Promise<boolean>;
}
