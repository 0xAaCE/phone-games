import { Party, PartyPlayer, PartyStatus } from '@phone-games/db';
import {
  GameState,
  ValidGameNames,
  Game,
  NextRoundParams,
  FinishRoundParams,
  FinishRoundResult,
  NextRoundResult,
  MiddleRoundActionResult,
  MiddleRoundActionParams,
} from '@phone-games/games';
import { ILogger } from '@phone-games/logger';
import { PartyService } from './partyService.js';
import { GameSessionManager } from './gameSessionManager.js';
import { PartyNotificationCoordinator } from './partyNotificationCoordinator.js';

/**
 * PartyManagerService - Mediator Pattern
 *
 * Coordinates interactions between:
 * - PartyService (party lifecycle)
 * - GameSessionManager (game orchestration)
 * - PartyNotificationCoordinator (player notifications)
 *
 * This service is now a pure coordinator/facade that delegates
 * to specialized components instead of handling everything itself.
 *
 * Reduced from 339 lines to ~150 lines by separating concerns.
 */
export class PartyManagerService {
  private logger: ILogger;

  constructor(
    private partyService: PartyService,
    private gameSessionManager: GameSessionManager,
    private notificationCoordinator: PartyNotificationCoordinator,
    logger: ILogger
  ) {
    this.logger = logger.child({ service: 'PartyManagerService' });
  }

  /**
   * Create a new party and initialize its game.
   */
  async createParty<T extends ValidGameNames>(
    userId: string,
    partyName: string,
    game: Game<T>
  ): Promise<Party> {
    this.logger.info('Mediating party creation', { userId, partyName, gameName: game.getName() });

    // 1. PARTY SERVICE - Create party
    const party = await this.partyService.createParty(userId, partyName, game.getName());

    // 2. GAME SESSION MANAGER - Initialize game
    await this.gameSessionManager.initializeGame(party.id, game);

    // 3. NOTIFICATION COORDINATOR - Notify creator
    await this.notificationCoordinator.notifyPartyCreated(party, userId);

    return party;
  }

  /**
   * Start a match in the party.
   */
  async startMatch(userId: string): Promise<{ party: Party; gameState: GameState<ValidGameNames> }> {
    this.logger.info('Mediating match start', { userId });

    // 1. PARTY SERVICE - Get party and players
    const partyId = await this.partyService.getPartyIdForUser(userId);
    const gamePlayers = await this.partyService.getGamePlayers(partyId);

    // 2. GAME SESSION MANAGER - Start game
    const gameState = await this.gameSessionManager.startGame(partyId, gamePlayers);

    // 3. PARTY SERVICE - Update party status
    const party = await this.partyService.updatePartyStatus(partyId, PartyStatus.ACTIVE);

    // 4. NOTIFICATION COORDINATOR - Notify all players
    const game = await this.gameSessionManager.getGame(partyId);
    await this.notificationCoordinator.notifyStartMatch(partyId, game);

    return { party, gameState };
  }

  /**
   * Advance to next round.
   */
  async nextRound(
    userId: string,
    nextRoundParams: NextRoundParams<ValidGameNames>
  ): Promise<NextRoundResult<ValidGameNames>> {
    this.logger.info('Mediating next round', { userId });

    // 1. PARTY SERVICE - Get party
    const partyId = await this.partyService.getPartyIdForUser(userId);

    // 2. GAME SESSION MANAGER - Process round
    const result = await this.gameSessionManager.nextRound(partyId, nextRoundParams);

    // 3. NOTIFICATION COORDINATOR - Notify all players
    const game = await this.gameSessionManager.getGame(partyId);
    await this.notificationCoordinator.notifyNextRound(partyId, game);

    return result;
  }

  /**
   * Process middle-round action (e.g., voting).
   */
  async middleRoundAction(
    userId: string,
    middleRoundActionParams: MiddleRoundActionParams<ValidGameNames>
  ): Promise<MiddleRoundActionResult<ValidGameNames>> {
    this.logger.info('Mediating middle round action', { userId });

    // 1. PARTY SERVICE - Get party
    const partyId = await this.partyService.getPartyIdForUser(userId);

    // 2. GAME SESSION MANAGER - Process action
    const result = await this.gameSessionManager.middleRoundAction(partyId, middleRoundActionParams);

    // 3. NOTIFICATION COORDINATOR - Notify user
    const game = await this.gameSessionManager.getGame(partyId);
    await this.notificationCoordinator.notifyMiddleRoundAction(userId, game);

    return result;
  }

  /**
   * Finish the current round.
   */
  async finishRound(
    userId: string,
    finishRoundParams: FinishRoundParams<ValidGameNames>
  ): Promise<FinishRoundResult<ValidGameNames>> {
    this.logger.info('Mediating finish round', { userId });

    // 1. PARTY SERVICE - Get party
    const partyId = await this.partyService.getPartyIdForUser(userId);

    // 2. GAME SESSION MANAGER - Finish round
    const result = await this.gameSessionManager.finishRound(partyId, finishRoundParams);

    // 3. NOTIFICATION COORDINATOR - Notify all players
    const game = await this.gameSessionManager.getGame(partyId);
    await this.notificationCoordinator.notifyFinishRound(partyId, game);

    return result;
  }

  /**
   * Finish the entire match.
   */
  async finishMatch(userId: string): Promise<GameState<ValidGameNames>> {
    this.logger.info('Mediating finish match', { userId });

    // 1. PARTY SERVICE - Get party
    const partyId = await this.partyService.getPartyIdForUser(userId);

    // 2. GAME SESSION MANAGER - Finish game
    const finalState = await this.gameSessionManager.finishGame(partyId);

    // 3. PARTY SERVICE - Update status
    await this.partyService.updatePartyStatus(partyId, PartyStatus.FINISHED);

    // 4. NOTIFICATION COORDINATOR - Notify all players
    const game = await this.gameSessionManager.getGame(partyId);
    await this.notificationCoordinator.notifyFinishMatch(partyId, game);

    return finalState;
  }

  /**
   * Join a party.
   */
  async joinParty(userId: string, partyId: string): Promise<PartyPlayer> {
    this.logger.info('Mediating join party', { userId, partyId });

    // 1. PARTY SERVICE - Add player
    const player = await this.partyService.joinParty(userId, partyId);

    // 2. NOTIFICATION COORDINATOR - Notify existing players
    const party = await this.partyService.getParty(partyId);
    if (party) {
      await this.notificationCoordinator.notifyPlayerJoined(partyId, party, userId);
    }

    return player;
  }

  /**
   * Leave a party.
   */
  async leaveParty(userId: string): Promise<void> {
    this.logger.info('Mediating leave party', { userId });

    // Get party info before leaving
    const partyId = await this.partyService.getPartyIdForUser(userId);
    const party = await this.partyService.getParty(partyId);

    // 1. PARTY SERVICE - Remove player
    const { remainingPlayers } = await this.partyService.leaveParty(userId);

    // 2. NOTIFICATION COORDINATOR - Notify remaining players (if any)
    if (remainingPlayers > 0 && party) {
      await this.notificationCoordinator.notifyPlayerLeft(partyId, party, userId);
    }

    // 3. GAME SESSION MANAGER - Clean up game if party was deleted
    if (remainingPlayers === 0) {
      const hasGame = await this.gameSessionManager.hasGame(partyId);
      if (hasGame) {
        await this.gameSessionManager.deleteGame(partyId);
      }
    }
  }

  /**
   * Delete a party.
   */
  async deleteParty(partyId: string): Promise<void> {
    this.logger.info('Mediating delete party', { partyId });

    // 1. GAME SESSION MANAGER - Delete game
    const hasGame = await this.gameSessionManager.hasGame(partyId);
    if (hasGame) {
      await this.gameSessionManager.deleteGame(partyId);
    }

    // 2. PARTY SERVICE - Delete party
    await this.partyService.deleteParty(partyId);
  }

  /**
   * Promote a player to manager.
   */
  async promoteToManager(userId: string, targetUserId: string): Promise<PartyPlayer> {
    return this.partyService.promoteToManager(userId, targetUserId);
  }

  /**
   * Get game state for a user.
   */
  async getGameState(userId: string): Promise<GameState<ValidGameNames>> {
    const partyId = await this.partyService.getPartyIdForUser(userId);
    return this.gameSessionManager.getGameState(partyId, userId);
  }

  // ========== Simple Delegation Methods ==========
  // These are read-only queries that just delegate to services

  async getParty(partyId: string): Promise<Party | null> {
    return this.partyService.getParty(partyId);
  }

  async getMyParty(userId: string): Promise<Party | null> {
    return this.partyService.getMyParty(userId);
  }

  async getAvailableParties(gameName?: string): Promise<Party[]> {
    return this.partyService.getAvailableParties(gameName);
  }

  async getPartyPlayers(partyId: string) {
    return this.partyService.getPartyPlayers(partyId);
  }

  async isUserInParty(userId: string, partyId: string): Promise<PartyPlayer | null> {
    return this.partyService.isUserInParty(userId, partyId);
  }

  // For backward compatibility (if needed by tests or external code)
  async updatePartyStatus(partyId: string, status: PartyStatus): Promise<Party> {
    return this.partyService.updatePartyStatus(partyId, status);
  }

  async getGamePlayers(partyId: string) {
    return this.partyService.getGamePlayers(partyId);
  }
}
