import {
  Game,
  GamePlayer,
  GameState,
  ValidGameNames,
  NextRoundParams,
  NextRoundResult,
  MiddleRoundActionParams,
  MiddleRoundActionResult,
  FinishRoundParams,
  FinishRoundResult,
} from '@phone-games/games';
import { NotFoundError } from '@phone-games/errors';
import { ILogger } from '@phone-games/logger';
import { IGameStateStorage } from '../interfaces/gameStateStorage.js';

/**
 * Manages game sessions and coordinates game lifecycle.
 * Separates game orchestration from party management.
 *
 * Responsibilities:
 * - Store/retrieve game instances
 * - Coordinate game lifecycle (start, rounds, finish)
 * - Manage game-party relationship
 */
export class GameSessionManager {
  private logger: ILogger;

  constructor(
    private gameStateStorage: IGameStateStorage,
    logger: ILogger
  ) {
    this.logger = logger.child({ service: 'GameSessionManager' });
  }

  /**
   * Initialize a new game session for a party.
   */
  async initializeGame(partyId: string, game: Game<ValidGameNames>): Promise<void> {
    await this.gameStateStorage.save(partyId, game);
    this.logger.info('Game initialized', { partyId, gameName: game.getName() });
  }

  /**
   * Start a game with the given players.
   */
  async startGame(partyId: string, players: GamePlayer[]): Promise<GameState<ValidGameNames>> {
    this.logger.info('Starting game', { partyId, playerCount: players.length });
    const game = await this.getGame(partyId);
    const gameState = await game.start(players);
    await this.gameStateStorage.save(partyId, game); // Save updated state
    return gameState;
  }

  /**
   * Advance to the next round.
   */
  async nextRound(
    partyId: string,
    params: NextRoundParams<ValidGameNames>
  ): Promise<NextRoundResult<ValidGameNames>> {
    this.logger.debug('Next round', { partyId });
    const game = await this.getGame(partyId);
    const result = await game.nextRound(params);
    await this.gameStateStorage.save(partyId, game);
    return result;
  }

  /**
   * Process a middle-round action (e.g., voting).
   */
  async middleRoundAction(
    partyId: string,
    params: MiddleRoundActionParams<ValidGameNames>
  ): Promise<MiddleRoundActionResult<ValidGameNames>> {
    this.logger.debug('Middle round action', { partyId });
    const game = await this.getGame(partyId);
    const result = await game.middleRoundAction(params);
    await this.gameStateStorage.save(partyId, game);
    return result;
  }

  /**
   * Finish the current round.
   */
  async finishRound(
    partyId: string,
    params: FinishRoundParams<ValidGameNames>
  ): Promise<FinishRoundResult<ValidGameNames>> {
    this.logger.debug('Finish round', { partyId });
    const game = await this.getGame(partyId);
    const result = await game.finishRound(params);
    await this.gameStateStorage.save(partyId, game);
    return result;
  }

  /**
   * Finish the entire match and clean up game state.
   */
  async finishGame(partyId: string): Promise<GameState<ValidGameNames>> {
    this.logger.info('Finishing game', { partyId });
    const game = await this.getGame(partyId);
    const finalState = await game.finishMatch();
    await this.gameStateStorage.delete(partyId);
    this.logger.info('Game finished and cleaned up', { partyId });
    return finalState;
  }

  /**
   * Get the game state for a specific user.
   * Returns user-specific view (e.g., impostor sees different info).
   */
  async getGameState(partyId: string, userId: string): Promise<GameState<ValidGameNames>> {
    const game = await this.getGame(partyId);
    return game.getGameState(userId);
  }

  /**
   * Get the game instance for a party.
   * Used internally and by notification coordinator.
   */
  async getGame(partyId: string): Promise<Game<ValidGameNames>> {
    const game = await this.gameStateStorage.get(partyId);
    if (!game) {
      this.logger.warn('Game state not found', { partyId });
      throw new NotFoundError('Game state not found for party');
    }
    return game;
  }

  /**
   * Check if a game session exists for a party.
   */
  async hasGame(partyId: string): Promise<boolean> {
    return this.gameStateStorage.has(partyId);
  }

  /**
   * Delete a game session (e.g., when party is deleted).
   */
  async deleteGame(partyId: string): Promise<void> {
    await this.gameStateStorage.delete(partyId);
    this.logger.info('Game deleted', { partyId });
  }
}
