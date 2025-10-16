import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PartyManagerService } from '../../services/partyManagerService.js';
import { NotFoundError, ConflictError, ValidationError } from '@phone-games/errors';
import { PartyTestFactory } from '../factories/partyFactory.js';
import { MockPrismaClient, MockNotificationService, MockGame, MockLogger } from '../mocks/dependencies.js';
import { PrismaClient, PartyStatus, PlayerRole } from '@phone-games/db';
import { NotificationService } from '@phone-games/notifications';
import { GAME_NAMES } from '@phone-games/games';
import { ILogger } from '@phone-games/logger';

describe('PartyManagerService', () => {
  let partyManagerService: PartyManagerService;
  let mockPrisma: PrismaClient;
  let mockNotificationService: NotificationService;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockPrisma = MockPrismaClient.create();
    mockNotificationService = MockNotificationService.create();
    mockLogger = MockLogger.create();
    partyManagerService = new PartyManagerService(mockPrisma, mockNotificationService, mockLogger);
  });

  describe('createParty', () => {
    it('should create a new party successfully', async () => {
      const userId = 'user-1';
      const partyName = 'Test Party';
      const game = MockGame.create(GAME_NAMES.IMPOSTOR);
      const expectedParty = PartyTestFactory.createParty({ partyName, gameName: 'impostor' });

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, null); // No existing party

      // Mock transaction
      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          party: { create: vi.fn().mockResolvedValue(expectedParty) },
          partyPlayer: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await partyManagerService.createParty(userId, partyName, game);

      expect(result).toEqual(expectedParty);
      expect(mockNotificationService.notifyCreateParty).toHaveBeenCalledWith(
        partyName,
        'impostor',
        expectedParty.id,
        userId
      );
    });

    it('should clean up existing party if user is manager', async () => {
      const userId = 'user-1';
      const partyName = 'New Party';
      const game = MockGame.create(GAME_NAMES.IMPOSTOR);
      const existingParty = PartyTestFactory.createPartyPlayer({
        userId,
        role: PlayerRole.MANAGER,
        partyId: 'old-party-id',
      });
      const newParty = PartyTestFactory.createParty({ partyName });

      (mockPrisma.partyPlayer.findFirst as any)
        .mockResolvedValueOnce(existingParty) // First call for existing party check
        .mockResolvedValueOnce(null); // Second call after cleanup

      MockPrismaClient.mockPartyFindUnique(mockPrisma, PartyTestFactory.createParty());

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          party: { create: vi.fn().mockResolvedValue(newParty) },
          partyPlayer: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await partyManagerService.createParty(userId, partyName, game);

      expect(result).toEqual(newParty);
      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'old-party-id' },
        data: { status: PartyStatus.FINISHED },
      });
    });
  });

  describe('joinParty', () => {
    it('should allow user to join a waiting party', async () => {
      const userId = 'user-2';
      const partyId = 'party-1';
      const party = PartyTestFactory.createParty({ id: partyId, status: PartyStatus.WAITING });
      const partyPlayer = PartyTestFactory.createPartyPlayer({ userId, partyId });

      MockPrismaClient.mockPartyFindUnique(mockPrisma, party);
      (mockPrisma.partyPlayer.findFirst as any).mockResolvedValue(null); // No existing active party
      (mockPrisma.partyPlayer.findUnique as any).mockResolvedValue(null); // Not already in this party
      (mockPrisma.partyPlayer.findMany as any).mockResolvedValue([]); // No players to notify yet
      MockPrismaClient.mockPartyPlayerCreate(mockPrisma, partyPlayer);

      const result = await partyManagerService.joinParty(userId, partyId);

      expect(result).toEqual(partyPlayer);
      expect(mockPrisma.partyPlayer.create).toHaveBeenCalledWith({
        data: {
          partyId,
          userId,
          role: PlayerRole.PLAYER,
        },
      });
    });

    it('should throw NotFoundError if party does not exist', async () => {
      const userId = 'user-2';
      const partyId = 'non-existent-party';

      MockPrismaClient.mockPartyFindUnique(mockPrisma, null);

      await expect(partyManagerService.joinParty(userId, partyId)).rejects.toThrow(NotFoundError);
      await expect(partyManagerService.joinParty(userId, partyId)).rejects.toThrow('Party not found');
    });

    it('should throw ValidationError if party is finished', async () => {
      const userId = 'user-2';
      const partyId = 'party-1';
      const party = PartyTestFactory.createParty({ id: partyId, status: PartyStatus.FINISHED });

      MockPrismaClient.mockPartyFindUnique(mockPrisma, party);

      await expect(partyManagerService.joinParty(userId, partyId)).rejects.toThrow(ValidationError);
      await expect(partyManagerService.joinParty(userId, partyId)).rejects.toThrow(
        'Cannot join a finished party'
      );
    });

    it('should throw ConflictError if user is already in an active party', async () => {
      const userId = 'user-2';
      const partyId = 'party-1';
      const party = PartyTestFactory.createParty({ id: partyId });
      const existingPartyPlayer = PartyTestFactory.createPartyPlayer({
        userId,
        partyId: 'other-party-id',
      });

      MockPrismaClient.mockPartyFindUnique(mockPrisma, party);
      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, existingPartyPlayer);

      await expect(partyManagerService.joinParty(userId, partyId)).rejects.toThrow(ConflictError);
      await expect(partyManagerService.joinParty(userId, partyId)).rejects.toThrow(
        'User is already in an active party'
      );
    });

    it('should throw ConflictError if user is already in this party', async () => {
      const userId = 'user-2';
      const partyId = 'party-1';
      const party = PartyTestFactory.createParty({ id: partyId });
      const existingPartyPlayer = PartyTestFactory.createPartyPlayer({ userId, partyId });

      MockPrismaClient.mockPartyFindUnique(mockPrisma, party);
      (mockPrisma.partyPlayer.findFirst as any).mockResolvedValue(null);
      (mockPrisma.partyPlayer.findUnique as any).mockResolvedValue(existingPartyPlayer);

      await expect(partyManagerService.joinParty(userId, partyId)).rejects.toThrow(ConflictError);
      await expect(partyManagerService.joinParty(userId, partyId)).rejects.toThrow(
        'User is already in this party'
      );
    });
  });

  describe('leaveParty', () => {
    it('should allow user to leave party', async () => {
      const userId = 'user-2';
      const partyId = 'party-1';
      const partyPlayer = PartyTestFactory.createPartyPlayer({ userId, partyId });
      const party = PartyTestFactory.createParty({ id: partyId });

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, partyPlayer);
      (mockPrisma.partyPlayer.delete as any).mockResolvedValue(undefined);
      (mockPrisma.partyPlayer.count as any).mockResolvedValue(1); // Still players remaining
      MockPrismaClient.mockPartyFindUnique(mockPrisma, party);
      (mockPrisma.partyPlayer.findMany as any).mockResolvedValue([]);

      await partyManagerService.leaveParty(userId);

      expect(mockPrisma.partyPlayer.delete).toHaveBeenCalledWith({
        where: {
          partyId_userId: {
            partyId,
            userId,
          },
        },
      });
    });

    it('should delete party if last player leaves', async () => {
      const userId = 'user-1';
      const partyId = 'party-1';
      const partyPlayer = PartyTestFactory.createPartyPlayer({ userId, partyId });
      const party = PartyTestFactory.createParty({ id: partyId });

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, partyPlayer);
      (mockPrisma.partyPlayer.delete as any).mockResolvedValue(undefined);
      (mockPrisma.partyPlayer.count as any).mockResolvedValue(0); // No players remaining
      MockPrismaClient.mockPartyFindUnique(mockPrisma, party);
      (mockPrisma.partyPlayer.findMany as any).mockResolvedValue([]); // No players to get
      (mockPrisma.party.delete as any).mockResolvedValue(undefined);

      await partyManagerService.leaveParty(userId);

      expect(mockPrisma.party.delete).toHaveBeenCalledWith({
        where: { id: partyId },
      });
    });

    it('should throw NotFoundError if user is not in any party', async () => {
      const userId = 'user-2';

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, null);

      await expect(partyManagerService.leaveParty(userId)).rejects.toThrow(NotFoundError);
      await expect(partyManagerService.leaveParty(userId)).rejects.toThrow('Party not found');
    });
  });

  describe('getParty', () => {
    it('should return party with players', async () => {
      const partyId = 'party-1';
      const party = PartyTestFactory.createParty({ id: partyId });

      MockPrismaClient.mockPartyFindUnique(mockPrisma, party);

      const result = await partyManagerService.getParty(partyId);

      expect(result).toEqual(party);
      expect(mockPrisma.party.findUnique).toHaveBeenCalledWith({
        where: { id: partyId },
        include: {
          players: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    it('should return null if party not found', async () => {
      const partyId = 'non-existent-party';

      MockPrismaClient.mockPartyFindUnique(mockPrisma, null);

      const result = await partyManagerService.getParty(partyId);

      expect(result).toBeNull();
    });
  });

  describe('getMyParty', () => {
    it('should return user current active party', async () => {
      const userId = 'user-1';
      const partyId = 'party-1';
      const partyPlayer = PartyTestFactory.createPartyPlayer({ userId, partyId });
      const party = PartyTestFactory.createParty({ id: partyId });

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, partyPlayer);
      MockPrismaClient.mockPartyFindUnique(mockPrisma, party);

      const result = await partyManagerService.getMyParty(userId);

      expect(result).toEqual(party);
    });

    it('should return null if user is not in any party', async () => {
      const userId = 'user-1';

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, null);

      const result = await partyManagerService.getMyParty(userId);

      expect(result).toBeNull();
    });
  });

  describe('startMatch', () => {
    it('should start a match successfully', async () => {
      const userId = 'user-1';
      const partyId = 'party-1';
      const partyPlayer = PartyTestFactory.createPartyPlayer({ userId, partyId });
      const game = MockGame.create(GAME_NAMES.IMPOSTOR);
      const gamePlayers = PartyTestFactory.createGamePlayers(3);
      const gameState = {
        currentRound: 1,
        isFinished: false,
        players: gamePlayers,
        customState: {},
      };

      // Set up the game in the service
      (partyManagerService as any).gameStates.set(partyId, game);

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, partyPlayer);
      (mockPrisma.partyPlayer.findMany as any).mockResolvedValue(
        gamePlayers.map((gp, i) => ({
          partyId,
          userId: gp.user.id,
          role: i === 0 ? PlayerRole.MANAGER : PlayerRole.PLAYER,
          user: gp.user,
        }))
      );
      (game.start as any).mockResolvedValue(gameState);
      (mockPrisma.party.update as any).mockResolvedValue(
        PartyTestFactory.createParty({ id: partyId, status: PartyStatus.ACTIVE })
      );

      const result = await partyManagerService.startMatch(userId);

      expect(result.party.status).toBe(PartyStatus.ACTIVE);
      expect(result.gameState).toEqual(gameState);
      expect(game.start).toHaveBeenCalledWith(gamePlayers);
      expect(mockNotificationService.notifyStartMatch).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundError if user is not in any party', async () => {
      const userId = 'user-1';

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, null);

      await expect(partyManagerService.startMatch(userId)).rejects.toThrow(NotFoundError);
      await expect(partyManagerService.startMatch(userId)).rejects.toThrow('Party not found');
    });

    it('should throw NotFoundError if game state not found', async () => {
      const userId = 'user-1';
      const partyId = 'party-1';
      const partyPlayer = PartyTestFactory.createPartyPlayer({ userId, partyId });

      MockPrismaClient.mockPartyPlayerFindFirst(mockPrisma, partyPlayer);
      (mockPrisma.partyPlayer.findMany as any).mockResolvedValue([]); // Mock getGamePlayers

      await expect(partyManagerService.startMatch(userId)).rejects.toThrow(NotFoundError);
      await expect(partyManagerService.startMatch(userId)).rejects.toThrow(
        'Game state not found for party'
      );
    });
  });

  describe('updatePartyStatus', () => {
    it('should update party status', async () => {
      const partyId = 'party-1';
      const updatedParty = PartyTestFactory.createParty({ id: partyId, status: PartyStatus.ACTIVE });

      (mockPrisma.party.update as any).mockResolvedValue(updatedParty);

      const result = await partyManagerService.updatePartyStatus(partyId, PartyStatus.ACTIVE);

      expect(result).toEqual(updatedParty);
      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: partyId },
        data: { status: PartyStatus.ACTIVE },
      });
    });
  });

  describe('getAvailableParties', () => {
    it('should return all waiting parties', async () => {
      const parties = [
        PartyTestFactory.createParty({ id: 'party-1' }),
        PartyTestFactory.createParty({ id: 'party-2' }),
      ];

      (mockPrisma.party.findMany as any).mockResolvedValue(parties);

      const result = await partyManagerService.getAvailableParties();

      expect(result).toEqual(parties);
      expect(mockPrisma.party.findMany).toHaveBeenCalledWith({
        where: {
          status: PartyStatus.WAITING,
        },
        include: {
          players: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    it('should filter by game name if provided', async () => {
      const parties = [PartyTestFactory.createParty({ gameName: 'impostor' })];

      (mockPrisma.party.findMany as any).mockResolvedValue(parties);

      const result = await partyManagerService.getAvailableParties('impostor');

      expect(result).toEqual(parties);
      expect(mockPrisma.party.findMany).toHaveBeenCalledWith({
        where: {
          status: PartyStatus.WAITING,
          gameName: 'impostor',
        },
        include: {
          players: {
            include: {
              user: true,
            },
          },
        },
      });
    });
  });
});
