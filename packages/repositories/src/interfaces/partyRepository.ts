import { Party, PartyPlayer, PartyStatus, PlayerRole, Prisma } from '@phone-games/db';

export type PartyPlayerWithUser = Prisma.PartyPlayerGetPayload<{
  include: { user: true };
}>;

export type PartyWithPlayers = Prisma.PartyGetPayload<{
  include: {
    players: {
      include: {
        user: true;
      };
    };
  };
}>;

export interface CreatePartyData {
  partyName: string;
  gameName: string;
  status: PartyStatus;
}

export interface CreatePartyPlayerData {
  partyId: string;
  userId: string;
  role: PlayerRole;
}

export interface CreatePartyWithPlayerData {
  party: CreatePartyData;
  player: Omit<CreatePartyPlayerData, 'partyId'>;
}

export interface IPartyRepository {
  // Party operations
  create(data: CreatePartyData): Promise<Party>;
  createWithPlayer(data: CreatePartyWithPlayerData): Promise<Party>;
  findById(id: string): Promise<Party | null>;
  findByIdWithPlayers(id: string): Promise<PartyWithPlayers | null>;
  update(id: string, data: Partial<CreatePartyData>): Promise<Party>;
  updateStatus(id: string, status: PartyStatus): Promise<Party>;
  delete(id: string): Promise<void>;
  findAvailableParties(gameName?: string): Promise<PartyWithPlayers[]>;

  // PartyPlayer operations
  createPlayer(data: CreatePartyPlayerData): Promise<PartyPlayer>;
  findPlayer(partyId: string, userId: string): Promise<PartyPlayer | null>;
  findPlayersByPartyId(partyId: string): Promise<PartyPlayerWithUser[]>;
  findActivePlayerForUser(userId: string): Promise<PartyPlayer | null>;
  findFirstActivePlayerForUser(userId: string): Promise<PartyPlayer | null>;
  updatePlayerRole(partyId: string, userId: string, role: PlayerRole): Promise<PartyPlayer>;
  deletePlayer(partyId: string, userId: string): Promise<void>;
  countPlayersByPartyId(partyId: string): Promise<number>;
}
