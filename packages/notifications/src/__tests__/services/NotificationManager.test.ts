import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationManager } from '../../services/NotificationManager.js';
import { MockNotificationProvider, MockParser } from '../mocks/providers.js';
import { GAME_NAMES } from '@phone-games/games';
import { ValidGameActions, ValidPartyActions } from '../../interfaces/Notification.js';

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;
  let mockProvider: ReturnType<typeof MockNotificationProvider.create>;
  let mockParser: ReturnType<typeof MockParser.create>;

  beforeEach(() => {
    mockParser = MockParser.create(GAME_NAMES.IMPOSTOR, 'whatsapp');
    notificationManager = new NotificationManager([mockParser]);
    mockProvider = MockNotificationProvider.create('whatsapp');
  });

  describe('registerUser', () => {
    it('should register a user with a notification provider', async () => {
      const userId = 'user-1';

      await notificationManager.registerUser(userId, mockProvider);

      expect(notificationManager.hasUser(userId)).toBe(true);
    });

    it('should allow multiple users to be registered', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const provider1 = MockNotificationProvider.create();
      const provider2 = MockNotificationProvider.create();

      await notificationManager.registerUser(user1, provider1);
      await notificationManager.registerUser(user2, provider2);

      expect(notificationManager.hasUser(user1)).toBe(true);
      expect(notificationManager.hasUser(user2)).toBe(true);
    });
  });

  describe('unregisterUser', () => {
    it('should unregister a user', async () => {
      const userId = 'user-1';

      await notificationManager.registerUser(userId, mockProvider);
      expect(notificationManager.hasUser(userId)).toBe(true);

      await notificationManager.unregisterUser(userId);
      expect(notificationManager.hasUser(userId)).toBe(false);
    });
  });

  describe('hasUser', () => {
    it('should return true for registered users', async () => {
      const userId = 'user-1';

      await notificationManager.registerUser(userId, mockProvider);

      expect(notificationManager.hasUser(userId)).toBe(true);
    });

    it('should return false for unregistered users', () => {
      const userId = 'non-existent-user';

      expect(notificationManager.hasUser(userId)).toBe(false);
    });
  });

  describe('notifyStartMatch', () => {
    it('should send start match notification', async () => {
      const userId = 'user-1';
      const gameState = {
        currentRound: 1,
        isFinished: false,
        players: [],
        customState: {},
      };

      await notificationManager.registerUser(userId, mockProvider);

      await notificationManager.notifyStartMatch(GAME_NAMES.IMPOSTOR, userId, gameState);

      expect(mockParser.parse).toHaveBeenCalledWith(ValidGameActions.START_MATCH, gameState);
      expect(mockProvider.sendNotification).toHaveBeenCalled();
    });

    it('should throw error if user not registered', async () => {
      const userId = 'unregistered-user';
      const gameState = {
        currentRound: 1,
        isFinished: false,
        players: [],
        customState: {},
      };

      await expect(
        notificationManager.notifyStartMatch(GAME_NAMES.IMPOSTOR, userId, gameState)
      ).rejects.toThrow('Notification provider not found for user');
    });
  });

  describe('notifyNextRound', () => {
    it('should send next round notification', async () => {
      const userId = 'user-1';
      const gameState = {
        currentRound: 2,
        isFinished: false,
        players: [],
        customState: {},
      };

      await notificationManager.registerUser(userId, mockProvider);

      await notificationManager.notifyNextRound(GAME_NAMES.IMPOSTOR, userId, gameState);

      expect(mockParser.parse).toHaveBeenCalledWith(ValidGameActions.NEXT_ROUND, gameState);
      expect(mockProvider.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyMiddleRoundAction', () => {
    it('should send middle round action notification', async () => {
      const userId = 'user-1';
      const gameState = {
        currentRound: 2,
        isFinished: false,
        players: [],
        customState: {},
      };

      await notificationManager.registerUser(userId, mockProvider);

      await notificationManager.notifyMiddleRoundAction(GAME_NAMES.IMPOSTOR, userId, gameState);

      expect(mockParser.parse).toHaveBeenCalledWith(ValidGameActions.MIDDLE_ROUND_ACTION, gameState);
      expect(mockProvider.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyFinishRound', () => {
    it('should send finish round notification', async () => {
      const userId = 'user-1';
      const gameState = {
        currentRound: 2,
        isFinished: false,
        players: [],
        customState: {},
      };

      await notificationManager.registerUser(userId, mockProvider);

      await notificationManager.notifyFinishRound(GAME_NAMES.IMPOSTOR, userId, gameState);

      expect(mockParser.parse).toHaveBeenCalledWith(ValidGameActions.FINISH_ROUND, gameState);
      expect(mockProvider.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyFinishMatch', () => {
    it('should send finish match notification', async () => {
      const userId = 'user-1';
      const gameState = {
        currentRound: 3,
        isFinished: true,
        players: [],
        customState: {},
      };

      await notificationManager.registerUser(userId, mockProvider);

      await notificationManager.notifyFinishMatch(GAME_NAMES.IMPOSTOR, userId, gameState);

      expect(mockParser.parse).toHaveBeenCalledWith(ValidGameActions.FINISH_MATCH, gameState);
      expect(mockProvider.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyCreateParty', () => {
    it('should send create party notification', async () => {
      const userId = 'user-1';
      const partyName = 'Test Party';
      const partyId = 'party-1';

      await notificationManager.registerUser(userId, mockProvider);

      await notificationManager.notifyCreateParty(partyName, GAME_NAMES.IMPOSTOR, partyId, userId);

      expect(mockParser.parse).toHaveBeenCalledWith(ValidPartyActions.CREATE_PARTY, {
        partyName,
        partyId,
        gameName: GAME_NAMES.IMPOSTOR,
      });
      expect(mockProvider.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyPlayerJoined', () => {
    it('should send player joined notification', async () => {
      const userId = 'user-1';
      const partyName = 'Test Party';
      const partyId = 'party-1';

      await notificationManager.registerUser(userId, mockProvider);

      await notificationManager.notifyPlayerJoined(partyName, GAME_NAMES.IMPOSTOR, partyId, userId);

      expect(mockParser.parse).toHaveBeenCalledWith(ValidPartyActions.PLAYER_JOINED, {
        partyName,
        partyId,
        gameName: GAME_NAMES.IMPOSTOR,
      });
      expect(mockProvider.sendNotification).toHaveBeenCalled();
    });
  });

  describe('notifyPlayerLeft', () => {
    it('should send player left notification', async () => {
      const userId = 'user-1';
      const partyName = 'Test Party';
      const partyId = 'party-1';

      await notificationManager.registerUser(userId, mockProvider);

      await notificationManager.notifyPlayerLeft(partyName, GAME_NAMES.IMPOSTOR, partyId, userId);

      expect(mockParser.parse).toHaveBeenCalledWith(ValidPartyActions.PLAYER_LEFT, {
        partyName,
        partyId,
        gameName: GAME_NAMES.IMPOSTOR,
      });
      expect(mockProvider.sendNotification).toHaveBeenCalled();
    });
  });

  describe('parser matching', () => {
    it('should throw error if no parser found for game and method combination', async () => {
      const userId = 'user-1';
      const differentMethodProvider = MockNotificationProvider.create('twilio');
      const gameState = {
        currentRound: 1,
        isFinished: false,
        players: [],
        customState: {},
      };

      // Register with twilio provider but only whatsapp parser is available
      await notificationManager.registerUser(userId, differentMethodProvider);

      await expect(
        notificationManager.notifyStartMatch(GAME_NAMES.IMPOSTOR, userId, gameState)
      ).rejects.toThrow('Parser not found');
    });

    it('should use correct parser for provider method', async () => {
      const userId = 'user-1';
      const twilioParser = MockParser.create(GAME_NAMES.IMPOSTOR, 'twilio');
      const twilioProvider = MockNotificationProvider.create('twilio');
      const notificationManagerWithTwilio = new NotificationManager([mockParser, twilioParser]);
      const gameState = {
        currentRound: 1,
        isFinished: false,
        players: [],
        customState: {},
      };

      await notificationManagerWithTwilio.registerUser(userId, twilioProvider);

      await notificationManagerWithTwilio.notifyStartMatch(GAME_NAMES.IMPOSTOR, userId, gameState);

      expect(twilioParser.parse).toHaveBeenCalled();
      expect(twilioProvider.sendNotification).toHaveBeenCalled();
      expect(mockParser.parse).not.toHaveBeenCalled();
    });
  });
});
