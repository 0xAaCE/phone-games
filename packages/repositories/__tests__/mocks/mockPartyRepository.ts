import { Party, PartyPlayer, PartyStatus, PlayerRole, User } from '@phone-games/db';
import {
  IPartyRepository,
  CreatePartyData,
  CreatePartyPlayerData,
  CreatePartyWithPlayerData,
  PartyPlayerWithUser,
  PartyWithPlayers,
} from '../../interfaces/partyRepository.js';

export class MockPartyRepository implements IPartyRepository {
  private parties: Map<string, Party> = new Map();
  private partyPlayers: Map<string, PartyPlayer> = new Map();
  private users: Map<string, User> = new Map();
  private partyIdCounter = 0;

  async create(data: CreatePartyData): Promise<Party> {
    this.partyIdCounter++;
    const party: Party = {
      id: `party-${Date.now()}-${this.partyIdCounter}`,
      partyName: data.partyName,
      gameName: data.gameName,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.parties.set(party.id, party);
    return party;
  }

  async createWithPlayer(data: CreatePartyWithPlayerData): Promise<Party> {
    const party = await this.create(data.party);

    const partyPlayer: PartyPlayer = {
      id: `pp-${Date.now()}`,
      partyId: party.id,
      userId: data.player.userId,
      role: data.player.role,
      joinedAt: new Date(),
    };

    const key = `${party.id}-${data.player.userId}`;
    this.partyPlayers.set(key, partyPlayer);

    return party;
  }

  async findById(id: string): Promise<Party | null> {
    return this.parties.get(id) ?? null;
  }

  async findByIdWithPlayers(id: string): Promise<PartyWithPlayers | null> {
    const party = this.parties.get(id);
    if (!party) return null;

    const players = Array.from(this.partyPlayers.values())
      .filter((pp) => pp.partyId === id)
      .map((pp) => {
        const user = this.users.get(pp.userId);
        if (!user) {
          throw new Error(`User ${pp.userId} not found`);
        }
        return {
          ...pp,
          user,
          party,
        };
      });

    return {
      ...party,
      players,
    };
  }

  async update(id: string, data: Partial<CreatePartyData>): Promise<Party> {
    const party = this.parties.get(id);
    if (!party) throw new Error('Party not found');

    const updatedParty: Party = {
      ...party,
      ...data,
      updatedAt: new Date(),
    };
    this.parties.set(id, updatedParty);
    return updatedParty;
  }

  async updateStatus(id: string, status: PartyStatus): Promise<Party> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    this.parties.delete(id);
    // Also delete associated players
    Array.from(this.partyPlayers.entries()).forEach(([key, pp]) => {
      if (pp.partyId === id) {
        this.partyPlayers.delete(key);
      }
    });
  }

  async findAvailableParties(gameName?: string): Promise<PartyWithPlayers[]> {
    const availableParties = Array.from(this.parties.values()).filter(
      (party) =>
        party.status === PartyStatus.WAITING &&
        (!gameName || party.gameName === gameName)
    );

    const partiesWithPlayers: PartyWithPlayers[] = [];
    for (const party of availableParties) {
      const withPlayers = await this.findByIdWithPlayers(party.id);
      if (withPlayers) {
        partiesWithPlayers.push(withPlayers);
      }
    }

    return partiesWithPlayers;
  }

  async createPlayer(data: CreatePartyPlayerData): Promise<PartyPlayer> {
    const partyPlayer: PartyPlayer = {
      id: `pp-${Date.now()}-${Math.random()}`,
      partyId: data.partyId,
      userId: data.userId,
      role: data.role,
      joinedAt: new Date(),
    };

    const key = `${data.partyId}-${data.userId}`;
    this.partyPlayers.set(key, partyPlayer);
    return partyPlayer;
  }

  async findPlayer(partyId: string, userId: string): Promise<PartyPlayer | null> {
    const key = `${partyId}-${userId}`;
    return this.partyPlayers.get(key) ?? null;
  }

  async findPlayersByPartyId(partyId: string): Promise<PartyPlayerWithUser[]> {
    return Array.from(this.partyPlayers.values())
      .filter((pp) => pp.partyId === partyId)
      .map((pp) => {
        const user = this.users.get(pp.userId);
        if (!user) {
          throw new Error(`User ${pp.userId} not found`);
        }
        const party = this.parties.get(pp.partyId);
        if (!party) {
          throw new Error(`Party ${pp.partyId} not found`);
        }
        return {
          ...pp,
          user,
          party,
        };
      });
  }

  async findActivePlayerForUser(userId: string): Promise<PartyPlayer | null> {
    for (const pp of this.partyPlayers.values()) {
      if (pp.userId === userId) {
        const party = this.parties.get(pp.partyId);
        if (
          party &&
          (party.status === PartyStatus.WAITING || party.status === PartyStatus.ACTIVE)
        ) {
          return pp;
        }
      }
    }
    return null;
  }

  async findFirstActivePlayerForUser(userId: string): Promise<PartyPlayer | null> {
    return this.findActivePlayerForUser(userId);
  }

  async updatePlayerRole(
    partyId: string,
    userId: string,
    role: PlayerRole
  ): Promise<PartyPlayer> {
    const key = `${partyId}-${userId}`;
    const partyPlayer = this.partyPlayers.get(key);
    if (!partyPlayer) throw new Error('PartyPlayer not found');

    const updatedPartyPlayer: PartyPlayer = {
      ...partyPlayer,
      role,
    };
    this.partyPlayers.set(key, updatedPartyPlayer);
    return updatedPartyPlayer;
  }

  async deletePlayer(partyId: string, userId: string): Promise<void> {
    const key = `${partyId}-${userId}`;
    this.partyPlayers.delete(key);
  }

  async countPlayersByPartyId(partyId: string): Promise<number> {
    return Array.from(this.partyPlayers.values()).filter(
      (pp) => pp.partyId === partyId
    ).length;
  }

  // Helper methods for testing
  clear(): void {
    this.parties.clear();
    this.partyPlayers.clear();
    this.users.clear();
  }

  seedParties(parties: Party[]): void {
    parties.forEach((party) => this.parties.set(party.id, party));
  }

  seedPlayers(players: PartyPlayer[]): void {
    players.forEach((pp) => {
      const key = `${pp.partyId}-${pp.userId}`;
      this.partyPlayers.set(key, pp);
    });
  }

  seedUsers(users: User[]): void {
    users.forEach((user) => this.users.set(user.id, user));
  }
}
