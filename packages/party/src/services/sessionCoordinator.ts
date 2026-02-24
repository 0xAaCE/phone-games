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
import { PlayerNotificationCoordinator } from './playerNotificationCoordinator.js';

/**
 * SessionCoordinator - Mediator Pattern
 *
 * Orchestrates the complete game session lifecycle by coordinating interactions
 * between three specialized services:
 * - PartyService: Manages party and player lifecycle (CRUD operations)
 * - GameSessionManager: Handles game state and business logic
 * - PlayerNotificationCoordinator: Manages player notifications
 *
 * This coordinator follows the Mediator pattern to reduce coupling between
 * services and provide a clean API for game session operations. It acts as
 * a facade that delegates to specialized components rather than implementing
 * all logic itself.
 *
 * Responsibilities:
 * - Party lifecycle (create, join, leave, delete)
 * - Match lifecycle (start, finish)
 * - Round lifecycle (next, middle action, finish)
 * - Player notifications coordination
 * - Query delegation (get party, get players, etc.)
 *
 * @example
 * ```typescript
 * // Create a coordinator with dependencies
 * const coordinator = new SessionCoordinator(
 *   partyService,
 *   gameSessionManager,
 *   notificationCoordinator,
 *   logger
 * );
 *
 * // Create a party and start a match
 * const party = await coordinator.createParty(userId, 'GameNight', impostorGame);
 * await coordinator.joinParty(user2Id, party.id);
 * await coordinator.startMatch(userId);
 *
 * // Play rounds
 * await coordinator.nextRound(userId, nextRoundParams);
 * await coordinator.middleRoundAction(user2Id, voteParams);
 * await coordinator.finishRound(userId, finishRoundParams);
 * ```
 */
export class SessionCoordinator {
  /** Logger instance with SessionCoordinator context */
  private logger: ILogger;

  /**
   * Creates a new SessionCoordinator
   *
   * @param partyService - Service for managing party and player data
   * @param gameSessionManager - Service for managing game state and logic
   * @param notificationCoordinator - Service for coordinating player notifications
   * @param logger - Logger instance for structured logging
   *
   * @example
   * ```typescript
   * const coordinator = new SessionCoordinator(
   *   new PartyService(partyRepository, playerRepository),
   *   new GameSessionManager(gameStateStore),
   *   new PlayerNotificationCoordinator(userRepository, notificationManager),
   *   logger
   * );
   * ```
   */
  constructor(
    private partyService: PartyService,
    private gameSessionManager: GameSessionManager,
    private notificationCoordinator: PlayerNotificationCoordinator,
    logger: ILogger
  ) {
    this.logger = logger.child({ service: 'SessionCoordinator' });
  }

  /**
   * Creates a new party and initializes its game state
   *
   * Orchestrates the party creation flow:
   * 1. Creates party record via PartyService
   * 2. Initializes game state via GameSessionManager
   * 3. Sends creation confirmation via PlayerNotificationCoordinator
   *
   * @template T - The specific game type (e.g., 'impostor')
   * @param userId - ID of the user creating the party (becomes party manager)
   * @param partyName - Human-readable name for the party
   * @param game - Game instance to play in this party
   * @returns The created party record
   *
   * @example
   * ```typescript
   * const impostorGame = new ImpostorGame();
   * const party = await coordinator.createParty(
   *   'user123',
   *   'Friday Night Games',
   *   impostorGame
   * );
   * console.log(`Party ${party.id} created with name ${party.partyName}`);
   * ```
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
   * Starts a match in the user's party
   *
   * Orchestrates the match start flow:
   * 1. Gets party and players via PartyService
   * 2. Initializes game state with players via GameSessionManager
   * 3. Updates party status to ACTIVE
   * 4. Notifies all players that the match has started
   *
   * @param userId - ID of the user starting the match (must be party manager)
   * @returns Object containing updated party and initial game state
   *
   * @throws {Error} If user is not in a party or not the party manager
   *
   * @example
   * ```typescript
   * const { party, gameState } = await coordinator.startMatch('user123');
   * console.log(`Match started with ${gameState.players.length} players`);
   * console.log(`Party status: ${party.status}`); // "ACTIVE"
   * ```
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
   * Advances the game to the next round
   *
   * Orchestrates the next round flow:
   * 1. Gets party ID via PartyService
   * 2. Processes round transition via GameSessionManager
   * 3. Notifies all players with their new round information
   *
   * @param userId - ID of the user advancing the round (must be party manager)
   * @param nextRoundParams - Game-specific parameters for the next round
   * @returns Result containing updated game state and round-specific data
   *
   * @throws {Error} If user is not party manager or game is not active
   *
   * @example
   * ```typescript
   * // For Impostor game
   * const result = await coordinator.nextRound('user123', {
   *   // Game-specific params
   * });
   * console.log(`Round ${result.gameState.currentRound} started`);
   * ```
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
   * Processes a middle-round action (e.g., voting, submission)
   *
   * Orchestrates the middle-round action flow:
   * 1. Gets party ID via PartyService
   * 2. Processes action via GameSessionManager
   * 3. Notifies the player that their action was received
   *
   * @param userId - ID of the user performing the action
   * @param middleRoundActionParams - Game-specific parameters for the action
   * @returns Result containing updated game state and action-specific data
   *
   * @throws {Error} If round is not active or action is invalid
   *
   * @example
   * ```typescript
   * // For Impostor game - voting
   * const result = await coordinator.middleRoundAction('user123', {
   *   vote: 'user456'
   * });
   * console.log('Vote recorded:', result.message);
   * ```
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
   * Finishes the current round and calculates results
   *
   * Orchestrates the round finish flow:
   * 1. Gets party ID via PartyService
   * 2. Processes round completion and calculates results via GameSessionManager
   * 3. Notifies all players with round results
   *
   * @param userId - ID of the user finishing the round (must be party manager)
   * @param finishRoundParams - Game-specific parameters for finishing the round
   * @returns Result containing updated game state and round results
   *
   * @throws {Error} If user is not party manager or round cannot be finished
   *
   * @example
   * ```typescript
   * const result = await coordinator.finishRound('user123', {
   *   // Game-specific params
   * });
   * console.log('Round results:', result.results);
   * console.log('Winner:', result.winner);
   * ```
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
   * Finishes the entire match and calculates final results
   *
   * Orchestrates the match finish flow:
   * 1. Gets party ID via PartyService
   * 2. Processes match completion via GameSessionManager
   * 3. Updates party status to FINISHED
   * 4. Notifies all players with final results
   *
   * @param userId - ID of the user finishing the match (must be party manager)
   * @returns Final game state with complete match results
   *
   * @throws {Error} If user is not party manager or match cannot be finished
   *
   * @example
   * ```typescript
   * const finalState = await coordinator.finishMatch('user123');
   * console.log('Match finished!');
   * console.log('Final scores:', finalState.players);
   * ```
   */
  async finishMatch(userId: string): Promise<GameState<ValidGameNames>> {
    this.logger.info('Mediating finish match', { userId });

    // 1. PARTY SERVICE - Get party
    const partyId = await this.partyService.getPartyIdForUser(userId);

    // 2. GAME SESSION MANAGER - Get game reference before finishing (finishGame deletes state)
    const game = await this.gameSessionManager.getGame(partyId);

    // 3. GAME SESSION MANAGER - Finish game
    const finalState = await this.gameSessionManager.finishGame(partyId);

    // 4. PARTY SERVICE - Update status
    await this.partyService.updatePartyStatus(partyId, PartyStatus.FINISHED);

    // 5. NOTIFICATION COORDINATOR - Notify all players
    await this.notificationCoordinator.notifyFinishMatch(partyId, game);

    return finalState;
  }

  /**
   * Adds a player to an existing party
   *
   * Orchestrates the join party flow:
   * 1. Adds player to party via PartyService
   * 2. Notifies all existing players that a new player has joined
   *
   * @param userId - ID of the user joining the party
   * @param partyId - ID of the party to join
   * @returns The created PartyPlayer record
   *
   * @throws {Error} If party doesn't exist, is full, or already started
   *
   * @example
   * ```typescript
   * const player = await coordinator.joinParty('user456', 'party123');
   * console.log(`${player.userId} joined party ${player.partyId}`);
   * ```
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
   * Removes a player from their current party
   *
   * Orchestrates the leave party flow:
   * 1. Removes player from party via PartyService
   * 2. Notifies remaining players (if any) that player left
   * 3. Cleans up game state if party is now empty
   *
   * If this was the last player, the party and its game state are deleted.
   *
   * @param userId - ID of the user leaving the party
   * @returns Promise that resolves when leave is complete
   *
   * @throws {Error} If user is not in a party
   *
   * @example
   * ```typescript
   * await coordinator.leaveParty('user456');
   * console.log('User left the party');
   * ```
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
   * Deletes a party and its associated game state
   *
   * Orchestrates the party deletion flow:
   * 1. Deletes game state via GameSessionManager (if exists)
   * 2. Deletes party record via PartyService
   *
   * @param partyId - ID of the party to delete
   * @returns Promise that resolves when deletion is complete
   *
   * @example
   * ```typescript
   * await coordinator.deleteParty('party123');
   * console.log('Party deleted');
   * ```
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
   * Promotes a player to party manager role
   *
   * Only the current party manager can promote another player.
   *
   * @param userId - ID of current manager performing the promotion
   * @param targetUserId - ID of player to promote to manager
   * @returns Updated PartyPlayer record with manager role
   *
   * @throws {Error} If user is not current manager or target not in party
   *
   * @example
   * ```typescript
   * const newManager = await coordinator.promoteToManager('user123', 'user456');
   * console.log(`User ${newManager.userId} is now party manager`);
   * ```
   */
  async promoteToManager(userId: string, targetUserId: string): Promise<PartyPlayer> {
    return this.partyService.promoteToManager(userId, targetUserId);
  }

  /**
   * Gets the current game state for a user
   *
   * Returns user-specific view of game state (may hide information
   * based on game rules, e.g., other players' roles).
   *
   * @param userId - ID of user requesting game state
   * @returns Current game state from the user's perspective
   *
   * @throws {Error} If user is not in an active game
   *
   * @example
   * ```typescript
   * const gameState = await coordinator.getGameState('user123');
   * console.log(`Round ${gameState.currentRound} of ${gameState.totalRounds}`);
   * ```
   */
  async getGameState(userId: string): Promise<GameState<ValidGameNames>> {
    const partyId = await this.partyService.getPartyIdForUser(userId);
    return this.gameSessionManager.getGameState(partyId, userId);
  }

  // ========== Query Delegation Methods ==========
  // These are read-only queries that delegate directly to PartyService

  /**
   * Gets a party by ID
   *
   * @param partyId - ID of the party to retrieve
   * @returns Party record or null if not found
   *
   * @example
   * ```typescript
   * const party = await coordinator.getParty('party123');
   * if (party) {
   *   console.log(`Party: ${party.partyName} (${party.status})`);
   * }
   * ```
   */
  async getParty(partyId: string): Promise<Party | null> {
    return this.partyService.getParty(partyId);
  }

  /**
   * Gets the party that a user is currently in
   *
   * @param userId - ID of the user
   * @returns Party record or null if user is not in a party
   *
   * @example
   * ```typescript
   * const myParty = await coordinator.getMyParty('user123');
   * if (myParty) {
   *   console.log(`You are in party: ${myParty.partyName}`);
   * }
   * ```
   */
  async getMyParty(userId: string): Promise<Party | null> {
    return this.partyService.getMyParty(userId);
  }

  /**
   * Gets all available parties (not started or finished)
   *
   * @param gameName - Optional filter by game type
   * @returns Array of available parties
   *
   * @example
   * ```typescript
   * const parties = await coordinator.getAvailableParties('impostor');
   * console.log(`${parties.length} Impostor parties available`);
   * ```
   */
  async getAvailableParties(gameName?: string): Promise<Party[]> {
    return this.partyService.getAvailableParties(gameName);
  }

  /**
   * Gets all players in a party
   *
   * @param partyId - ID of the party
   * @returns Array of PartyPlayer records
   *
   * @example
   * ```typescript
   * const players = await coordinator.getPartyPlayers('party123');
   * console.log(`${players.length} players in party`);
   * ```
   */
  async getPartyPlayers(partyId: string) {
    return this.partyService.getPartyPlayers(partyId);
  }

  /**
   * Checks if a user is in a specific party
   *
   * @param userId - ID of the user
   * @param partyId - ID of the party
   * @returns PartyPlayer record if user is in party, null otherwise
   *
   * @example
   * ```typescript
   * const player = await coordinator.isUserInParty('user123', 'party123');
   * if (player) {
   *   console.log('User is in this party');
   * }
   * ```
   */
  async isUserInParty(userId: string, partyId: string): Promise<PartyPlayer | null> {
    return this.partyService.isUserInParty(userId, partyId);
  }

  /**
   * Updates a party's status
   *
   * For backward compatibility. Prefer using game lifecycle methods
   * (startMatch, finishMatch) which update status automatically.
   *
   * @param partyId - ID of the party
   * @param status - New status to set
   * @returns Updated party record
   *
   * @example
   * ```typescript
   * const party = await coordinator.updatePartyStatus('party123', PartyStatus.ACTIVE);
   * ```
   */
  async updatePartyStatus(partyId: string, status: PartyStatus): Promise<Party> {
    return this.partyService.updatePartyStatus(partyId, status);
  }

  /**
   * Gets players formatted for game initialization
   *
   * @param partyId - ID of the party
   * @returns Array of game players
   *
   * @example
   * ```typescript
   * const gamePlayers = await coordinator.getGamePlayers('party123');
   * ```
   */
  async getGamePlayers(partyId: string) {
    return this.partyService.getGamePlayers(partyId);
  }
}
