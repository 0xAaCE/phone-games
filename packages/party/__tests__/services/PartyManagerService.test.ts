import { describe, it, expect, beforeEach } from 'vitest';
import { PartyManagerService } from '../../src/services/partyManagerService.js';
import { NotFoundError, ConflictError, ValidationError } from '@phone-games/errors';
import { PartyTestFactory } from '../factories/partyFactory.js';
import { MockNotificationService, MockGame, MockLogger } from '../mocks/dependencies.js';
import { PartyStatus, PlayerRole } from '@phone-games/db';
import { NotificationService } from '@phone-games/notifications';
import { GAME_NAMES } from '@phone-games/games';
import { ILogger } from '@phone-games/logger';
import { MockPartyRepository } from '@phone-games/repositories/__tests__/mocks/mockPartyRepository.js';

describe('PartyManagerService', () => {
  let partyManagerService: PartyManagerService;
  let mockPartyRepository: MockPartyRepository;
  let mockNotificationService: NotificationService;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockPartyRepository = new MockPartyRepository();
    mockPartyRepository.clear();
    mockNotificationService = MockNotificationService.create();
    mockLogger = MockLogger.create();
    partyManagerService = new PartyManagerService(mockPartyRepository, mockNotificationService, mockLogger);
  });

  describe('createParty', () => {
    it('should create a new party successfully', async () => {
      const userId = 'user-1';
      const partyName = 'Test Party';
      const game = MockGame.create(GAME_NAMES.IMPOSTOR);

      // Seed user for repository
      mockPartyRepository.seedUsers([PartyTestFactory.createUser({ id: userId })]);

      const result = await partyManagerService.createParty(userId, partyName, game);

      expect(result.partyName).toBe(partyName);
      expect(result.gameName).toBe('impostor');
      expect(result.status).toBe(PartyStatus.WAITING);
      expect(mockNotificationService.notifyCreateParty).toHaveBeenCalledWith(
        partyName,
        'impostor',
        result.id,
        userId
      );
    });

    it('should clean up existing party if user is manager', async () => {
      const userId = 'user-1';
      const partyName = 'New Party';
      const game = MockGame.create(GAME_NAMES.IMPOSTOR);

      // Seed user
      mockPartyRepository.seedUsers([PartyTestFactory.createUser({ id: userId })]);

      // Create existing party where user is manager
      const existingParty = await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Old Party',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId,
          role: PlayerRole.MANAGER,
        },
      });

      const result = await partyManagerService.createParty(userId, partyName, game);

      expect(result.partyName).toBe(partyName);

      // Verify old party was finished
      const oldParty = await mockPartyRepository.findById(existingParty.id);
      expect(oldParty?.status).toBe(PartyStatus.FINISHED);
    });

    it('should leave existing party if user is player', async () => {
      const userId = 'user-1';
      const managerId = 'manager-1';
      const partyName = 'New Party';
      const game = MockGame.create(GAME_NAMES.IMPOSTOR);

      // Seed users
      mockPartyRepository.seedUsers([
        PartyTestFactory.createUser({ id: userId }),
        PartyTestFactory.createUser({ id: managerId }),
      ]);

      // Create existing party where user is just a player
      const existingParty = await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Old Party',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId: managerId,
          role: PlayerRole.MANAGER,
        },
      });

      await mockPartyRepository.createPlayer({
        partyId: existingParty.id,
        userId,
        role: PlayerRole.PLAYER,
      });

      const result = await partyManagerService.createParty(userId, partyName, game);

      expect(result.partyName).toBe(partyName);

      // Verify user left old party
      const oldPartyPlayer = await mockPartyRepository.findPlayer(existingParty.id, userId);
      expect(oldPartyPlayer).toBeNull();
    });
  });

  describe('joinParty', () => {
    it('should allow user to join a waiting party', async () => {
      const userId = 'user-2';
      const managerId = 'manager-1';

      // Seed users
      mockPartyRepository.seedUsers([
        PartyTestFactory.createUser({ id: userId }),
        PartyTestFactory.createUser({ id: managerId }),
      ]);

      const party = await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Test Party',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId: managerId,
          role: PlayerRole.MANAGER,
        },
      });

      const result = await partyManagerService.joinParty(userId, party.id);

      expect(result.userId).toBe(userId);
      expect(result.partyId).toBe(party.id);
      expect(result.role).toBe(PlayerRole.PLAYER);
    });

    it('should throw NotFoundError if party does not exist', async () => {
      await expect(partyManagerService.joinParty('user-1', 'non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if party is finished', async () => {
      const userId = 'user-2';
      const managerId = 'manager-1';

      mockPartyRepository.seedUsers([
        PartyTestFactory.createUser({ id: userId }),
        PartyTestFactory.createUser({ id: managerId }),
      ]);

      const party = await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Finished Party',
          gameName: 'impostor',
          status: PartyStatus.FINISHED,
        },
        player: {
          userId: managerId,
          role: PlayerRole.MANAGER,
        },
      });

      await expect(partyManagerService.joinParty(userId, party.id)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if user is already in an active party', async () => {
      const userId = 'user-1';

      mockPartyRepository.seedUsers([PartyTestFactory.createUser({ id: userId })]);

      await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Party 1',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId,
          role: PlayerRole.MANAGER,
        },
      });

      const party2 = await mockPartyRepository.create({
        partyName: 'Party 2',
        gameName: 'impostor',
        status: PartyStatus.WAITING,
      });

      await expect(partyManagerService.joinParty(userId, party2.id)).rejects.toThrow(ConflictError);
    });
  });

  describe('leaveParty', () => {
    it('should allow user to leave a party', async () => {
      const userId = 'user-2';
      const managerId = 'manager-1';

      mockPartyRepository.seedUsers([
        PartyTestFactory.createUser({ id: userId }),
        PartyTestFactory.createUser({ id: managerId }),
      ]);

      const party = await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Test Party',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId: managerId,
          role: PlayerRole.MANAGER,
        },
      });

      await mockPartyRepository.createPlayer({
        partyId: party.id,
        userId,
        role: PlayerRole.PLAYER,
      });

      await partyManagerService.leaveParty(userId);

      const partyPlayer = await mockPartyRepository.findPlayer(party.id, userId);
      expect(partyPlayer).toBeNull();
    });

    it('should delete party if no players remain', async () => {
      const userId = 'user-1';

      mockPartyRepository.seedUsers([PartyTestFactory.createUser({ id: userId })]);

      const party = await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Test Party',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId,
          role: PlayerRole.MANAGER,
        },
      });

      await partyManagerService.leaveParty(userId);

      const deletedParty = await mockPartyRepository.findById(party.id);
      expect(deletedParty).toBeNull();
    });

    it('should throw NotFoundError if user has no active party', async () => {
      await expect(partyManagerService.leaveParty('user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getParty', () => {
    it('should return party with players', async () => {
      const managerId = 'manager-1';

      mockPartyRepository.seedUsers([PartyTestFactory.createUser({ id: managerId })]);

      const party = await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Test Party',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId: managerId,
          role: PlayerRole.MANAGER,
        },
      });

      const result = await partyManagerService.getParty(party.id);

      expect(result).not.toBeNull();
      expect(result?.partyName).toBe('Test Party');
    });

    it('should return null if party does not exist', async () => {
      const result = await partyManagerService.getParty('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAvailableParties', () => {
    it('should return only waiting parties', async () => {
      mockPartyRepository.seedUsers([
        PartyTestFactory.createUser({ id: 'user-1' }),
        PartyTestFactory.createUser({ id: 'user-2' }),
      ]);

      await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Waiting Party',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId: 'user-1',
          role: PlayerRole.MANAGER,
        },
      });

      await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Active Party',
          gameName: 'impostor',
          status: PartyStatus.ACTIVE,
        },
        player: {
          userId: 'user-2',
          role: PlayerRole.MANAGER,
        },
      });

      const result = await partyManagerService.getAvailableParties();

      expect(result.length).toBe(1);
      expect(result[0].partyName).toBe('Waiting Party');
    });

    it('should filter by game name if provided', async () => {
      mockPartyRepository.seedUsers([
        PartyTestFactory.createUser({ id: 'user-1' }),
        PartyTestFactory.createUser({ id: 'user-2' }),
      ]);

      await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Impostor Party',
          gameName: 'impostor',
          status: PartyStatus.WAITING,
        },
        player: {
          userId: 'user-1',
          role: PlayerRole.MANAGER,
        },
      });

      await mockPartyRepository.createWithPlayer({
        party: {
          partyName: 'Other Game Party',
          gameName: 'other-game',
          status: PartyStatus.WAITING,
        },
        player: {
          userId: 'user-2',
          role: PlayerRole.MANAGER,
        },
      });

      const result = await partyManagerService.getAvailableParties('impostor');

      expect(result.length).toBe(1);
      expect(result[0].gameName).toBe('impostor');
    });
  });
});
