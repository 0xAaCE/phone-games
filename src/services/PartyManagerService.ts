import { PrismaClient, Party, PartyPlayer, PartyStatus, PlayerRole } from '@db';
import { GamePlayer, GameState, ValidGameNames } from '../interfaces/Game';
import { ValidationError, ConflictError, NotFoundError } from '../errors';
import { Game } from '../games/Game';

export class PartyManagerService {
  private gameStates: Map<string, GameState<any>> = new Map();

  constructor(private db: PrismaClient) {}

  async createParty<T extends ValidGameNames>(
    userId: string,
    partyName: string,
    game: Game<T>
  ): Promise<Party> {
    const party = await this.db.party.create({
      data: {
        partyName,
        gameName: game.getName(),
        status: PartyStatus.WAITING,
      },
    });

    await this.db.partyPlayer.create({
      data: {
        partyId: party.id,
        userId,
        role: PlayerRole.MANAGER,
      },
    });

    return party;
  }

  async startMatch<T extends ValidGameNames>(
    userId: string,
    game: Game<T>
  ): Promise<{ party: Party; gameState: GameState<T> }> {
    const partyId = await this.getActivePartyIdForUser(userId);
    const gamePlayers = await this.getGamePlayers(partyId);

    const gameState = await game.start(gamePlayers);
    this.gameStates.set(partyId, gameState);

    const party = await this.updatePartyStatus(partyId, PartyStatus.ACTIVE);

    return { party, gameState };
  }

  async nextRound<T extends ValidGameNames>(
    userId: string,
    game: Game<T>
  ): Promise<GameState<T>> {
    const partyId = await this.getActivePartyIdForUser(userId);
    const currentState = this.gameStates.get(partyId) as GameState<T>;
    if (!currentState) {
      throw new NotFoundError('Game state not found for party');
    }

    const newState = await game.nextRound(currentState);
    this.gameStates.set(partyId, newState);

    return newState;
  }

  async finishRound<T extends ValidGameNames>(
    userId: string,
    game: Game<T>
  ): Promise<GameState<T>> {
    const partyId = await this.getActivePartyIdForUser(userId);
    const currentState = this.gameStates.get(partyId) as GameState<T>;
    if (!currentState) {
      throw new NotFoundError('Game state not found for party');
    }

    const newState = await game.finishRound(currentState);
    this.gameStates.set(partyId, newState);

    return newState;
  }

  async finishMatch<T extends ValidGameNames>(
    userId: string,
    game: Game<T>
  ): Promise<GameState<T>> {
    const partyId = await this.getActivePartyIdForUser(userId);
    const currentState = this.gameStates.get(partyId) as GameState<T>;
    if (!currentState) {
      throw new NotFoundError('Game state not found for party');
    }

    const finalState = await game.finishMatch(currentState);
    this.gameStates.set(partyId, finalState);

    await this.updatePartyStatus(partyId, PartyStatus.FINISHED);

    return finalState;
  }

  getGameState<T extends ValidGameNames>(userId: string): Promise<GameState<T> | undefined> {
    return this.getActivePartyIdForUser(userId).then(partyId =>
      this.gameStates.get(partyId) as GameState<T>
    );
  }

  private async getActivePartyIdForUser(userId: string): Promise<string> {
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

    if (!partyPlayer) {
      throw new NotFoundError('User is not in any active party');
    }

    return partyPlayer.partyId;
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
    const partyId = await this.getActivePartyIdForUser(userId);

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
    const partyId = await this.getActivePartyIdForUser(userId);

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

  async getPartyPlayers(partyId: string): Promise<PartyPlayer[]> {
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
}