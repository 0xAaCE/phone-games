import { Party, PartyPlayer, PartyStatus, PlayerRole } from '@phone-games/db';
import { ValidationError, ConflictError, NotFoundError } from '@phone-games/errors';
import { ILogger } from '@phone-games/logger';
import { IPartyRepository, PartyPlayerWithUser } from '@phone-games/repositories';
import { GamePlayer } from '@phone-games/games';

/**
 * Manages party lifecycle and player management.
 * Pure party domain logic - no game or notification concerns.
 *
 * Responsibilities:
 * - Party CRUD operations
 * - Player join/leave/promote
 * - Party status management
 * - Party queries
 */
export class PartyService {
  private logger: ILogger;

  constructor(
    private partyRepository: IPartyRepository,
    logger: ILogger
  ) {
    this.logger = logger.child({ service: 'PartyService' });
  }

  /**
   * Create a new party.
   * Handles cleanup of existing active party for the user.
   */
  async createParty(
    userId: string,
    partyName: string,
    gameName: string
  ): Promise<Party> {
    this.logger.info('Creating party', { userId, partyName, gameName });

    // Check if user is already in an active party
    const existingParty = await this.partyRepository.findActivePlayerForUser(userId);

    if (existingParty) {
      await this.handleExistingPartyForUser(existingParty, userId);
    }

    // Create new party with user as manager
    const party = await this.partyRepository.createWithPlayer({
      party: {
        partyName,
        gameName,
        status: PartyStatus.WAITING,
      },
      player: {
        userId,
        role: PlayerRole.MANAGER,
      },
    });

    this.logger.info('Party created', { partyId: party.id, userId });
    return party;
  }

  /**
   * Join an existing party.
   */
  async joinParty(userId: string, partyId: string): Promise<PartyPlayer> {
    this.logger.info('User joining party', { userId, partyId });

    // Validate party exists and is joinable
    await this.validatePartyForJoin(partyId);

    // Check if user is already in any active party
    const existingActiveParty = await this.partyRepository.findActivePlayerForUser(userId);
    if (existingActiveParty) {
      throw new ConflictError('User is already in an active party');
    }

    // Check if user is already in this party
    const existingPlayer = await this.partyRepository.findPlayer(partyId, userId);
    if (existingPlayer) {
      throw new ConflictError('User is already in this party');
    }

    // Add player to party
    const player = await this.partyRepository.createPlayer({
      partyId,
      userId,
      role: PlayerRole.PLAYER,
    });

    this.logger.info('User joined party', { userId, partyId });
    return player;
  }

  /**
   * Leave a party.
   * Automatically deletes the party if no players remain.
   */
  async leaveParty(userId: string): Promise<{ partyId: string; remainingPlayers: number }> {
    this.logger.info('User leaving party', { userId });

    const player = await this.partyRepository.findActivePlayerForUser(userId);
    if (!player) {
      throw new NotFoundError('Party not found');
    }

    const partyId = player.partyId;

    // Remove player from party
    await this.partyRepository.deletePlayer(partyId, userId);

    // Check remaining players
    const remainingPlayers = await this.partyRepository.countPlayersByPartyId(partyId);

    // Clean up empty party
    if (remainingPlayers === 0) {
      await this.partyRepository.delete(partyId);
      this.logger.info('Empty party deleted', { partyId });
    }

    this.logger.info('User left party', { userId, partyId, remainingPlayers });
    return { partyId, remainingPlayers };
  }

  /**
   * Promote a player to manager role.
   */
  async promoteToManager(userId: string, targetUserId: string): Promise<PartyPlayer> {
    const player = await this.partyRepository.findActivePlayerForUser(userId);
    if (!player) {
      throw new NotFoundError('Party not found');
    }

    this.logger.info('Promoting player to manager', {
      partyId: player.partyId,
      userId,
      targetUserId,
    });

    return this.partyRepository.updatePlayerRole(player.partyId, targetUserId, PlayerRole.MANAGER);
  }

  /**
   * Update party status.
   */
  async updatePartyStatus(partyId: string, status: PartyStatus): Promise<Party> {
    this.logger.info('Updating party status', { partyId, status });
    return this.partyRepository.updateStatus(partyId, status);
  }

  /**
   * Delete a party.
   */
  async deleteParty(partyId: string): Promise<void> {
    this.logger.info('Deleting party', { partyId });
    await this.partyRepository.delete(partyId);
  }

  /**
   * Get a party by ID with players.
   */
  async getParty(partyId: string): Promise<Party | null> {
    return this.partyRepository.findByIdWithPlayers(partyId);
  }

  /**
   * Get the active party for a user.
   */
  async getMyParty(userId: string): Promise<Party | null> {
    const player = await this.partyRepository.findActivePlayerForUser(userId);
    if (!player) {
      return null;
    }
    return this.getParty(player.partyId);
  }

  /**
   * Get available parties (waiting or active).
   */
  async getAvailableParties(gameName?: string): Promise<Party[]> {
    return this.partyRepository.findAvailableParties(gameName);
  }

  /**
   * Get all players in a party.
   */
  async getPartyPlayers(partyId: string): Promise<PartyPlayerWithUser[]> {
    return this.partyRepository.findPlayersByPartyId(partyId);
  }

  /**
   * Convert party players to game players format.
   */
  async getGamePlayers(partyId: string): Promise<GamePlayer[]> {
    const partyPlayers = await this.getPartyPlayers(partyId);

    return partyPlayers.map((pp) => ({
      user: pp.user,
      isManager: pp.role === PlayerRole.MANAGER,
    }));
  }

  /**
   * Check if a user is in a specific party.
   */
  async isUserInParty(userId: string, partyId: string): Promise<PartyPlayer | null> {
    return this.partyRepository.findPlayer(partyId, userId);
  }

  /**
   * Get the active party player for a user.
   */
  async getActivePartyPlayerForUser(userId: string): Promise<PartyPlayer | null> {
    return this.partyRepository.findActivePlayerForUser(userId);
  }

  /**
   * Get party ID for a user.
   * Throws NotFoundError if user is not in a party.
   */
  async getPartyIdForUser(userId: string): Promise<string> {
    const player = await this.partyRepository.findActivePlayerForUser(userId);
    if (!player) {
      throw new NotFoundError('Party not found');
    }
    return player.partyId;
  }

  /**
   * Handle cleanup when user creates a new party but is already in one.
   */
  private async handleExistingPartyForUser(
    existingParty: PartyPlayer,
    userId: string
  ): Promise<void> {
    if (existingParty.role === PlayerRole.MANAGER) {
      // If manager, finish the party
      this.logger.info('Finishing existing party for manager', {
        partyId: existingParty.partyId,
        userId,
      });
      await this.partyRepository.updateStatus(existingParty.partyId, PartyStatus.FINISHED);
    } else {
      // If player, just leave the party
      this.logger.info('Leaving existing party', {
        partyId: existingParty.partyId,
        userId,
      });
      await this.leaveParty(userId);
    }
  }

  /**
   * Validate that a party exists and can be joined.
   */
  private async validatePartyForJoin(partyId: string): Promise<Party> {
    const party = await this.partyRepository.findById(partyId);

    if (!party) {
      throw new NotFoundError('Party not found');
    }

    if (party.status === PartyStatus.FINISHED) {
      throw new ValidationError('Cannot join a finished party');
    }

    return party;
  }
}
