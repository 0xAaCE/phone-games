import { Game, ValidGameNames } from '@phone-games/games';
import { IGameStateStorage } from '../interfaces/gameStateStorage.js';

/**
 * In-memory implementation of game state storage.
 * Used for development and testing. Games are lost on server restart.
 *
 * For production, use RedisGameStateStorage or DatabaseGameStateStorage.
 */
export class InMemoryGameStateStorage implements IGameStateStorage {
  private games: Map<string, Game<ValidGameNames>> = new Map();

  async save(partyId: string, game: Game<ValidGameNames>): Promise<void> {
    this.games.set(partyId, game);
  }

  async get(partyId: string): Promise<Game<ValidGameNames> | null> {
    return this.games.get(partyId) || null;
  }

  async delete(partyId: string): Promise<void> {
    this.games.delete(partyId);
  }

  async has(partyId: string): Promise<boolean> {
    return this.games.has(partyId);
  }

  /**
   * Clear all games. Useful for testing.
   */
  clear(): void {
    this.games.clear();
  }

  /**
   * Get count of active games. Useful for monitoring.
   */
  size(): number {
    return this.games.size;
  }
}
