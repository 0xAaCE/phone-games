import { PrismaClient, Party, PartyPlayer, PartyStatus, PlayerRole, Prisma } from '@phone-games/db';
import { GamePlayer, GameState, ValidGameNames, Game, NextRoundParams, FinishRoundParams, FinishRoundResult, NextRoundResult, MiddleRoundActionResult, MiddleRoundActionParams } from '@phone-games/games';
import { ValidationError, ConflictError, NotFoundError } from '../errors';
import { NotificationService } from '@phone-games/notifications';

type PartyPlayerWithUser = Prisma.PartyPlayerGetPayload<{
  include: { user: true };
}>;

export class PartyManagerService {
  private gameStates: Map<string, Game<ValidGameNames>> = new Map();

  constructor(private db: PrismaClient, private notificationService: NotificationService) {}

  async createParty<T extends ValidGameNames>(
    userId: string,
    partyName: string,
    game: Game<T>
  ): Promise<Party> {
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

    return party;
  }

  async startMatch(
    userId: string,
  ): Promise<{ party: Party; gameState: GameState<ValidGameNames> }> {
    const { partyId } = await this.getActivePartyPlayerForUser(userId) || { };

    if (!partyId) {
      throw new NotFoundError('Party not found');
    }

    const gamePlayers = await this.getGamePlayers(partyId);
    const game = this.gameStates.get(partyId);
    if (!game) {
      throw new NotFoundError('Game state not found for party');
    }

    const gameState = await game.start(gamePlayers);

    const party = await this.updatePartyStatus(partyId, PartyStatus.ACTIVE);

    for (const gamePlayer of gamePlayers) {
      await this.notificationService.notifyStartMatch(game.getName(), gamePlayer.user.id, gameState);
    }

    return { party, gameState };
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

    const newState = await game.nextRound(nextRoundParams);

    for (const gamePlayer of gamePlayers) {
      await this.notificationService.notifyNextRound(game.getName(), gamePlayer.user.id, newState);
    }

    return newState;
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


    const newState = await game.middleRoundAction(middleRoundActionParams);

    await this.notificationService.notifyMiddleRoundAction(game.getName(), userId, newState);

    return newState;
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

    const newState = await game.finishRound(finishRoundParams);

    const gamePlayers = await this.getGamePlayers(partyId);

    for (const gamePlayer of gamePlayers) {
      await this.notificationService.notifyFinishRound(game.getName(), gamePlayer.user.id, newState);
    }

    return newState;
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

    const finalState = await game.finishMatch();

    const gamePlayers = await this.getGamePlayers(partyId);

    await this.updatePartyStatus(partyId, PartyStatus.FINISHED);

    for (const gamePlayer of gamePlayers) {
      await this.notificationService.notifyFinishMatch(game.getName(), gamePlayer.user.id, finalState);
    }

    return finalState;
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

    if (remainingPlayers === 0) {
      await this.deleteParty(partyId);
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