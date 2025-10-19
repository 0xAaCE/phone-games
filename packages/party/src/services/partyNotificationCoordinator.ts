import { Party } from '@phone-games/db';
import { Game, GameState, ValidGameNames } from '@phone-games/games';
import { NotificationService } from '@phone-games/notifications';
import { ILogger } from '@phone-games/logger';
import { IPartyRepository, PartyPlayerWithUser } from '@phone-games/repositories';

/**
 * Coordinates notifications to all players in a party.
 * Uses Template Method pattern to eliminate duplicate notification loops.
 */
export class PartyNotificationCoordinator {
  private logger: ILogger;

  constructor(
    private notificationService: NotificationService,
    private partyRepository: IPartyRepository,
    logger: ILogger
  ) {
    this.logger = logger.child({ service: 'PartyNotificationCoordinator' });
  }

  /**
   * Template method for notifying all players with game state.
   * Each player receives a personalized game state (e.g., impostor sees different word).
   */
  private async notifyAllPlayersWithGameState(
    partyId: string,
    game: Game<ValidGameNames>,
    notifyFn: (gameName: ValidGameNames, userId: string, state: GameState<ValidGameNames>) => Promise<void>
  ): Promise<void> {
    const players = await this.getPartyPlayers(partyId);

    await Promise.all(
      players.map(async (player) => {
        try {
          const gameState = game.getGameState(player.user.id);
          await notifyFn(game.getName(), player.user.id, gameState);
        } catch (error) {
          this.logger.error('Failed to notify player', error as Error, {
            partyId,
            userId: player.user.id,
          });
          // Continue notifying other players even if one fails
        }
      })
    );
  }

  /**
   * Notify all players when match starts.
   */
  async notifyStartMatch(partyId: string, game: Game<ValidGameNames>): Promise<void> {
    this.logger.debug('Notifying start match', { partyId, gameName: game.getName() });
    await this.notifyAllPlayersWithGameState(
      partyId,
      game,
      (gameName, userId, state) => this.notificationService.notifyStartMatch(gameName, userId, state)
    );
  }

  /**
   * Notify all players when next round starts.
   */
  async notifyNextRound(partyId: string, game: Game<ValidGameNames>): Promise<void> {
    this.logger.debug('Notifying next round', { partyId, gameName: game.getName() });
    await this.notifyAllPlayersWithGameState(
      partyId,
      game,
      (gameName, userId, state) => this.notificationService.notifyNextRound(gameName, userId, state)
    );
  }

  /**
   * Notify single player about their middle round action (e.g., vote received).
   */
  async notifyMiddleRoundAction(userId: string, game: Game<ValidGameNames>): Promise<void> {
    this.logger.debug('Notifying middle round action', { userId, gameName: game.getName() });
    const gameState = game.getGameState(userId);
    await this.notificationService.notifyMiddleRoundAction(game.getName(), userId, gameState);
  }

  /**
   * Notify all players when round finishes.
   */
  async notifyFinishRound(partyId: string, game: Game<ValidGameNames>): Promise<void> {
    this.logger.debug('Notifying finish round', { partyId, gameName: game.getName() });
    await this.notifyAllPlayersWithGameState(
      partyId,
      game,
      (gameName, userId, state) => this.notificationService.notifyFinishRound(gameName, userId, state)
    );
  }

  /**
   * Notify all players when match finishes.
   */
  async notifyFinishMatch(partyId: string, game: Game<ValidGameNames>): Promise<void> {
    this.logger.debug('Notifying finish match', { partyId, gameName: game.getName() });
    await this.notifyAllPlayersWithGameState(
      partyId,
      game,
      (gameName, userId, state) => this.notificationService.notifyFinishMatch(gameName, userId, state)
    );
  }

  /**
   * Notify creator when party is created.
   */
  async notifyPartyCreated(party: Party, userId: string): Promise<void> {
    this.logger.debug('Notifying party created', { partyId: party.id, userId });
    await this.notificationService.notifyCreateParty(
      party.partyName,
      party.gameName as ValidGameNames,
      party.id,
      userId
    );
  }

  /**
   * Notify all existing players when a new player joins.
   */
  async notifyPlayerJoined(partyId: string, party: Party, newPlayerId: string): Promise<void> {
    this.logger.debug('Notifying player joined', { partyId, newPlayerId });
    const players = await this.getPartyPlayers(partyId);

    await Promise.all(
      players.map(async (player) => {
        // Don't notify the player who just joined
        if (player.user.id === newPlayerId) {
          return;
        }

        try {
          await this.notificationService.notifyPlayerJoined(
            party.partyName,
            party.gameName as ValidGameNames,
            partyId,
            player.user.id
          );
        } catch (error) {
          this.logger.error('Failed to notify player joined', error as Error, {
            partyId,
            userId: player.user.id,
          });
        }
      })
    );
  }

  /**
   * Notify all remaining players when a player leaves.
   */
  async notifyPlayerLeft(partyId: string, party: Party, leftPlayerId: string): Promise<void> {
    this.logger.debug('Notifying player left', { partyId, leftPlayerId });
    const players = await this.getPartyPlayers(partyId);

    await Promise.all(
      players.map(async (player) => {
        // Don't notify the player who just left
        if (player.user.id === leftPlayerId) {
          return;
        }

        try {
          await this.notificationService.notifyPlayerLeft(
            party.partyName,
            party.gameName as ValidGameNames,
            partyId,
            player.user.id
          );
        } catch (error) {
          this.logger.error('Failed to notify player left', error as Error, {
            partyId,
            userId: player.user.id,
          });
        }
      })
    );
  }

  private async getPartyPlayers(partyId: string): Promise<PartyPlayerWithUser[]> {
    return this.partyRepository.findPlayersByPartyId(partyId);
  }
}
