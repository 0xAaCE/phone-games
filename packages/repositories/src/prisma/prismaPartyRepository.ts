import { PrismaClient, Party, PartyPlayer, PartyStatus, PlayerRole } from '@phone-games/db';
import {
  IPartyRepository,
  CreatePartyData,
  CreatePartyPlayerData,
  CreatePartyWithPlayerData,
  PartyPlayerWithUser,
  PartyWithPlayers,
} from '../interfaces/partyRepository.js';

export class PrismaPartyRepository implements IPartyRepository {
  constructor(private db: PrismaClient) {}

  async create(data: CreatePartyData): Promise<Party> {
    return this.db.party.create({
      data,
    });
  }

  async createWithPlayer(data: CreatePartyWithPlayerData): Promise<Party> {
    return this.db.$transaction(async (tx) => {
      const party = await tx.party.create({
        data: data.party,
      });

      await tx.partyPlayer.create({
        data: {
          partyId: party.id,
          userId: data.player.userId,
          role: data.player.role,
        },
      });

      return party;
    });
  }

  async findById(id: string): Promise<Party | null> {
    return this.db.party.findUnique({
      where: { id },
    });
  }

  async findByIdWithPlayers(id: string): Promise<PartyWithPlayers | null> {
    return this.db.party.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<CreatePartyData>): Promise<Party> {
    return this.db.party.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: PartyStatus): Promise<Party> {
    return this.db.party.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.party.delete({
      where: { id },
    });
  }

  async findAvailableParties(gameName?: string): Promise<PartyWithPlayers[]> {
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

  async createPlayer(data: CreatePartyPlayerData): Promise<PartyPlayer> {
    return this.db.partyPlayer.create({
      data,
    });
  }

  async findPlayer(partyId: string, userId: string): Promise<PartyPlayer | null> {
    return this.db.partyPlayer.findUnique({
      where: {
        partyId_userId: {
          partyId,
          userId,
        },
      },
    });
  }

  async findPlayersByPartyId(partyId: string): Promise<PartyPlayerWithUser[]> {
    return this.db.partyPlayer.findMany({
      where: { partyId },
      include: {
        user: true,
      },
    });
  }

  async findActivePlayerForUser(userId: string): Promise<PartyPlayer | null> {
    return this.db.partyPlayer.findFirst({
      where: {
        userId,
        party: {
          status: {
            in: [PartyStatus.WAITING, PartyStatus.ACTIVE],
          },
        },
      },
    });
  }

  async findFirstActivePlayerForUser(userId: string): Promise<PartyPlayer | null> {
    return this.db.partyPlayer.findFirst({
      where: {
        userId,
        party: {
          status: {
            in: [PartyStatus.WAITING, PartyStatus.ACTIVE],
          },
        },
      },
    });
  }

  async updatePlayerRole(partyId: string, userId: string, role: PlayerRole): Promise<PartyPlayer> {
    return this.db.partyPlayer.update({
      where: {
        partyId_userId: {
          partyId,
          userId,
        },
      },
      data: { role },
    });
  }

  async deletePlayer(partyId: string, userId: string): Promise<void> {
    await this.db.partyPlayer.delete({
      where: {
        partyId_userId: {
          partyId,
          userId,
        },
      },
    });
  }

  async countPlayersByPartyId(partyId: string): Promise<number> {
    return this.db.partyPlayer.count({
      where: { partyId },
    });
  }
}
