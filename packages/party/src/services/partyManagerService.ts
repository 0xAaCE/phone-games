import { PrismaClient, Party, PartyPlayer, PartyStatus, PlayerRole, Prisma } from '@phone-games/db';
import { GamePlayer, GameState, ValidGameNames, Game, NextRoundParams, FinishRoundParams, FinishRoundResult, NextRoundResult, MiddleRoundActionResult, MiddleRoundActionParams } from '@phone-games/games';
import { ValidationError, ConflictError, NotFoundError } from '@phone-games/errors';
import { NotificationService } from '@phone-games/notifications';
import { ILogger } from '@phone-games/logger';

type PartyPlayerWithUser = Prisma.PartyPlayerGetPayload<{
  include: { user: true };
}>;

export class PartyManagerService {
  private gameStates: Map<string, Game<ValidGameNames>> = new Map();
  private logger: ILogger;

  constructor(
    private db: PrismaClient,
    private notificationService: NotificationService,
    logger: ILogger
  ) {
    this.logger = logger.child({ service: 'PartyManagerService' });
  }

  async createParty<T extends ValidGameNames>(
    userId: string,
    partyName: string,
    game: Game<T>
  ): Promise<Party> {
    this.logger.info('Creating party', { userId, partyName, gameName: game.getName() });
    const existingParty = await this.getActivePartyPlayerForUser(userId);

    // Clean up existing active party
    if (existingParty) {
      if (existingParty.role === PlayerRole.MANAGER) {
        // If manager, finish the party (updates status to FINISHED)
        await this.updatePartyStatus(existingParty.partyId, PartyStatus.FINISHED);
      } else {
        // If player, just leave the party (removes party_player record)
        await this.leaveParty(userId);
      }
    }

    // Create new party
    const party = await this.db.$transaction(async (tx) => {
      const party = await tx.party.create({
        data: {
          partyName,
          gameName: game.getName(),
          status: PartyStatus.WAITING,
        },
      });

      await tx.partyPlayer.create({
        data: {
          partyId: party.id,
          userId,
          role: PlayerRole.MANAGER,
        },
      });

      return party;
    });

    this.gameStates.set(party.id, game);

    await this.notificationService.notifyCreateParty(party.partyName, party.gameName as ValidGameNames, party.id, userId);

    this.logger.info('Party created successfully', { partyId: party.id, userId, partyName });
    return party;
  }

  async startMatch(
    userId: string,
  ): Promise<{ party: Party; gameState: GameState<ValidGameNames> }> {
    this.logger.info('Starting match', { userId });
    const { partyId } = await this.getActivePartyPlayerForUser(userId) || { };

    if (!partyId) {
      this.logger.warn('Cannot start match: party not found', { userId });
      throw new NotFoundError('Party not found');
    }

    const gamePlayers = await this.getGamePlayers(partyId);
    const game = this.gameStates.get(partyId);
    if (!game) {
      throw new NotFoundError('Game state not found for party');
    }

    const result = await game.start(gamePlayers);

    const party = await this.updatePartyStatus(partyId, PartyStatus.ACTIVE);

    for (const gamePlayer of gamePlayers) {
      const newState = game.getGameState(gamePlayer.user.id);
      await this.notificationService.notifyStartMatch(game.getName(), gamePlayer.user.id, newState);
    }

    this.logger.info('Match started successfully', { partyId, playerCount: gamePlayers.length });
    return { party, gameState: result };
  }

  async nextRound(
    userId: string,
    nextRoundParams: NextRoundParams<ValidGameNames>
  ): Promise<NextRoundResult<ValidGameNames>> {
    const { partyId } = await this.getActivePartyPlayerForUser(userId) || { };

    if (!partyId) {
      throw new NotFoundError('Party not found');
    }

    const game = this.gameStates.get(partyId);
    if (!game) {
      throw new NotFoundError('Game state not found for party');
    }

    const gamePlayers = await this.getGamePlayers(partyId);

    const result = await game.nextRound(nextRoundParams);

    for (const gamePlayer of gamePlayers) {
      const newState = game.getGameState(gamePlayer.user.id);
      await this.notificationService.notifyNextRound(game.getName(), gamePlayer.user.id, newState);
    }

    return result;
  }

  async middleRoundAction(
    userId: string,
    middleRoundActionParams: MiddleRoundActionParams<ValidGameNames>
  ): Promise<MiddleRoundActionResult<ValidGameNames>> {
    const { partyId } = await this.getActivePartyPlayerForUser(userId) || { };

    if (!partyId) {
      throw new NotFoundError('Party not found');
    }

    const game = this.gameStates.get(partyId);

    if (!game) {
      throw new NotFoundError('Game state not found for party');
    }


    const result = await game.middleRoundAction(middleRoundActionParams);
    const newState = game.getGameState(userId);

    await this.notificationService.notifyMiddleRoundAction(game.getName(), userId, newState);

    return result;
  }

  async finishRound(
    userId: string,
    finishRoundParams: FinishRoundParams<ValidGameNames>
  ): Promise<FinishRoundResult<ValidGameNames>> {
    const { partyId } = await this.getActivePartyPlayerForUser(userId) || { };

    if (!partyId) {
      throw new NotFoundError('Party not found');
    }

    const game = this.gameStates.get(partyId);
    if (!game) {
      throw new NotFoundError('Game state not found for party');
    }

    const result = await game.finishRound(finishRoundParams);


    const gamePlayers = await this.getGamePlayers(partyId);

    for (const gamePlayer of gamePlayers) {
      const newState = game.getGameState(gamePlayer.user.id);

      await this.notificationService.notifyFinishRound(game.getName(), gamePlayer.user.id, newState);
    }

    return result;
  }

  async finishMatch(
    userId: string,
  ): Promise<GameState<ValidGameNames>> {
    const { partyId } = await this.getActivePartyPlayerForUser(userId) || { };

    if (!partyId) {
      throw new NotFoundError('Party not found');
    }

    const game = this.gameStates.get(partyId);
    if (!game) {
      throw new NotFoundError('Game state not found for party');
    }

    const result = await game.finishMatch();

    const gamePlayers = await this.getGamePlayers(partyId);

    await this.updatePartyStatus(partyId, PartyStatus.FINISHED);

    for (const gamePlayer of gamePlayers) {
      const newState = game.getGameState(gamePlayer.user.id);
      await this.notificationService.notifyFinishMatch(game.getName(), gamePlayer.user.id, newState);
    }

    return result;
  }

  async getParty(partyId: string): Promise<Party | null> {
    return this.db.party.findUnique({
      where: { id: partyId },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getMyParty(userId: string): Promise<Party | null> {
    const partyId = await this.getActivePartyPlayerForUser(userId);

    if (!partyId) {
      return null;
    }

    return this.getParty(partyId.partyId);
  }

  async updatePartyStatus(partyId: string, status: PartyStatus): Promise<Party> {
    return this.db.party.update({
      where: { id: partyId },
      data: { status },
    });
  }

  async deleteParty(partyId: string): Promise<void> {
    this.gameStates.delete(partyId);
    await this.db.party.delete({
      where: { id: partyId },
    });
  }

  async joinParty(userId: string, partyId: string): Promise<PartyPlayer> {
    const party = await this.db.party.findUnique({
      where: { id: partyId },
    });

    if (!party) {
      throw new NotFoundError('Party not found');
    }

    if (party.status === PartyStatus.FINISHED) {
      throw new ValidationError('Cannot join a finished party');
    }

    // Check if user is already in any active party
    const existingActiveParty = await this.db.partyPlayer.findFirst({
      where: {
        userId,
        party: {
          status: {
            in: [PartyStatus.WAITING, PartyStatus.ACTIVE],
          },
        },
      },
    });

    if (existingActiveParty) {
      throw new ConflictError('User is already in an active party');
    }

    const existingPlayer = await this.isUserInParty(userId, partyId);
    if (existingPlayer) {
     
      throw new ConflictError('User is already in this party');
    }

    for (const gamePlayer of await this.getGamePlayers(partyId)) {
      if (gamePlayer.user.id === userId) {
        continue;
      }
      await this.notificationService.notifyPlayerJoined(party.partyName, party.gameName as ValidGameNames, partyId, gamePlayer.user.id);
    }

    return this.db.partyPlayer.create({
      data: {
        partyId,
        userId,
        role: PlayerRole.PLAYER,
      },
    });
  }

  async leaveParty(userId: string): Promise<void> {
    const { partyId } = await this.getActivePartyPlayerForUser(userId) || { };

    if (!partyId) {
      throw new NotFoundError('Party not found');
    }

    await this.db.partyPlayer.delete({
      where: {
        partyId_userId: {
          partyId,
          userId,
        },
      },
    });

    const remainingPlayers = await this.db.partyPlayer.count({
      where: { partyId },
    });

    const party = await this.getParty(partyId);
    if (!party) {
      throw new NotFoundError('Party not found');
    }

    if (remainingPlayers === 0) {
      await this.deleteParty(partyId);
    }

    for (const gamePlayer of await this.getGamePlayers(partyId)) {
      if (gamePlayer.user.id === userId) {
        continue;
      }
      await this.notificationService.notifyPlayerLeft(party.partyName, party.gameName as ValidGameNames, partyId, gamePlayer.user.id);
    }
  }

  async promoteToManager(userId: string, targetUserId: string): Promise<PartyPlayer> {
    const { partyId } = await this.getActivePartyPlayerForUser(userId) || { };

    if (!partyId) {
      throw new NotFoundError('Party not found');
    }

    return this.db.partyPlayer.update({
      where: {
        partyId_userId: {
          partyId,
          userId: targetUserId,
        },
      },
      data: { role: PlayerRole.MANAGER },
    });
  }

  async getPartyPlayers(partyId: string): Promise<PartyPlayerWithUser[]> {
    return this.db.partyPlayer.findMany({
      where: { partyId },
      include: {
        user: true,
      },
    });
  }

  async getGamePlayers(partyId: string): Promise<GamePlayer[]> {
    const partyPlayers = await this.getPartyPlayers(partyId);

    return partyPlayers.map(pp => ({
      user: pp.user,
      isManager: pp.role === PlayerRole.MANAGER,
    }));
  }

  async getAvailableParties(gameName?: string): Promise<Party[]> {
    return this.db.party.findMany({
      where: {
        status: PartyStatus.WAITING,
        ...(gameName && { gameName }),
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async isUserInParty(userId: string, partyId: string): Promise<PartyPlayer | null> {
    return this.db.partyPlayer.findUnique({
      where: {
        partyId_userId: {
          partyId,
          userId,
        },
      },
    });
  }

  async getGameState(userId: string): Promise<GameState<ValidGameNames>> {
    const partyPlayer = await this.getActivePartyPlayerForUser(userId);

    if (!partyPlayer) {
      throw new NotFoundError('Party not found');
    }

    const partyId = partyPlayer.partyId;

    const game = this.gameStates.get(partyId);
    if (!game) {
      throw new NotFoundError('Game state not found for party');
    }

    return game.getGameState(partyPlayer.userId);
  }

  private async getActivePartyPlayerForUser(userId: string): Promise<PartyPlayer | null> {
    const partyPlayer = await this.db.partyPlayer.findFirst({
      where: {
        userId,
        party: {
          status: {
            in: [PartyStatus.WAITING, PartyStatus.ACTIVE],
          },
        },
      },
    });


    return partyPlayer;
  }
}