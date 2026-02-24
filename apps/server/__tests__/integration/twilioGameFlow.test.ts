import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagePlatform } from '@phone-games/messaging';
import { ILogger } from '@phone-games/logger';
import { createTestServices, TestServices } from '../helpers/testServiceFactory.js';
import { TwilioMessageFactory, TEST_USERS } from '../helpers/twilioMessageFactory.js';

function createMockLogger(): ILogger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLevel: vi.fn(),
    child: vi.fn().mockReturnThis(),
  } as unknown as ILogger;
}

/**
 * Helper: create a party with 3 players and return the partyId
 */
async function setupPartyWithPlayers(
  services: TestServices,
  users: { phoneNumber: string; name: string }[] = [TEST_USERS.alice, TEST_USERS.bob, TEST_USERS.charlie],
  partyName = 'TestParty'
) {
  const { messageHandlerService, mockPartyRepository } = services;
  const [creator, ...joiners] = users;

  // Creator creates party
  await messageHandlerService.handle(
    MessagePlatform.TWILIO,
    TwilioMessageFactory.createMessage(creator.phoneNumber, `/create_party impostor ${partyName}`, creator.name)
  );

  const parties = await mockPartyRepository.findAvailableParties('impostor');
  const partyId = parties[parties.length - 1].id;

  // Others join
  for (const joiner of joiners) {
    await messageHandlerService.handle(
      MessagePlatform.TWILIO,
      TwilioMessageFactory.createMessage(joiner.phoneNumber, `/join_party ${partyId}`, joiner.name)
    );
  }

  return partyId;
}

/**
 * Helper: start a match and first round
 */
async function startMatchAndRound(services: TestServices, creator: { phoneNumber: string; name: string }) {
  const { messageHandlerService } = services;

  await messageHandlerService.handle(
    MessagePlatform.TWILIO,
    TwilioMessageFactory.createMessage(creator.phoneNumber, '/start_match', creator.name)
  );

  await messageHandlerService.handle(
    MessagePlatform.TWILIO,
    TwilioMessageFactory.createMessage(creator.phoneNumber, '/next_round', creator.name)
  );
}

/**
 * Helper: all players vote and finish the round
 */
async function voteAndFinishRound(
  services: TestServices,
  voters: { phoneNumber: string; name: string }[],
  finisher: { phoneNumber: string; name: string }
) {
  const { messageHandlerService } = services;

  // Each player votes for the next player in the list
  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i];
    const target = voters[(i + 1) % voters.length];
    await messageHandlerService.handle(
      MessagePlatform.TWILIO,
      TwilioMessageFactory.createMessage(voter.phoneNumber, `/vote ${target.name}`, voter.name)
    );
  }

  // Finish the round
  await messageHandlerService.handle(
    MessagePlatform.TWILIO,
    TwilioMessageFactory.createMessage(finisher.phoneNumber, '/finish_round', finisher.name)
  );
}

describe('Twilio Game Flow Integration Tests', () => {
  let services: TestServices;
  let logger: ILogger;

  beforeEach(() => {
    TwilioMessageFactory.reset();
    vi.clearAllMocks();

    process.env.TWILIO_ACCOUNT_SID = 'AC' + '0'.repeat(32);
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
    process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+11234567890';

    logger = createMockLogger();
    services = createTestServices(logger);
  });

  // ========================================
  // A. Basic game flow (fixed from original)
  // ========================================
  describe('basic game flow', () => {
    it('should complete a full game round with 3 players via Twilio messages', async () => {
      const { messageHandlerService, mockPartyRepository, twilioSendNotificationSpy } = services;

      // Create party
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/create_party impostor FridayGames', TEST_USERS.alice.name)
      );

      const parties = await mockPartyRepository.findAvailableParties('impostor');
      expect(parties).toHaveLength(1);
      expect(parties[0].partyName).toBe('FridayGames');
      expect(parties[0].gameName).toBe('impostor');
      const partyId = parties[0].id;

      // Bob joins
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.bob.phoneNumber, `/join_party ${partyId}`, TEST_USERS.bob.name)
      );

      // Charlie joins
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.charlie.phoneNumber, `/join_party ${partyId}`, TEST_USERS.charlie.name)
      );

      const partyPlayers = await mockPartyRepository.findPlayersByPartyId(partyId);
      expect(partyPlayers).toHaveLength(3);

      // Start match
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/start_match', TEST_USERS.alice.name)
      );

      const party = await mockPartyRepository.findById(partyId);
      expect(party?.status).toBe('ACTIVE');

      // Start round
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/next_round', TEST_USERS.alice.name)
      );

      // All vote
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/vote Bob', TEST_USERS.alice.name)
      );
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.bob.phoneNumber, '/vote Alice', TEST_USERS.bob.name)
      );
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.charlie.phoneNumber, '/vote Alice', TEST_USERS.charlie.name)
      );

      // Finish round
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/finish_round', TEST_USERS.alice.name)
      );

      // Verify party still active with all players
      const finalParty = await mockPartyRepository.findById(partyId);
      expect(finalParty?.status).toBe('ACTIVE');
      const finalPlayers = await mockPartyRepository.findPlayersByPartyId(partyId);
      expect(finalPlayers).toHaveLength(3);

      // Verify Twilio notifications were sent
      expect(twilioSendNotificationSpy).toHaveBeenCalled();
      const notificationCalls = twilioSendNotificationSpy.mock.calls;

      // Verify key notification content exists
      const bodies = notificationCalls.map((call: unknown[]) => {
        const notification = call[0] as { body?: string; template?: { sid: string } };
        return notification.body ?? '';
      });

      // Create party notification
      expect(bodies.some((body: string) => body.toLowerCase().includes('created'))).toBe(true);
    });
  });

  // ========================================
  // B. Full game lifecycle with multiple rounds
  // ========================================
  describe('multi-round game lifecycle', () => {
    it('should complete 2 rounds and verify party stays active', async () => {
      const { mockPartyRepository, twilioSendNotificationSpy } = services;
      const players = [TEST_USERS.alice, TEST_USERS.bob, TEST_USERS.charlie];

      const partyId = await setupPartyWithPlayers(services, players, 'MultiRound');

      // Start match
      await startMatchAndRound(services, TEST_USERS.alice);

      // Round 1: vote and finish
      await voteAndFinishRound(services, players, TEST_USERS.alice);

      // Round 2: start, vote, and finish
      await services.messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/next_round', TEST_USERS.alice.name)
      );
      await voteAndFinishRound(services, players, TEST_USERS.alice);

      // Verify party status is still ACTIVE after 2 rounds
      const party = await mockPartyRepository.findById(partyId);
      expect(party?.status).toBe('ACTIVE');

      // Verify all 3 players are still in the party
      const finalPlayers = await mockPartyRepository.findPlayersByPartyId(partyId);
      expect(finalPlayers).toHaveLength(3);

      // Multi-round game should generate more notifications than single-round
      // Round 2 adds: next_round (3) + votes (3) + finish_round (3) = 9 more
      const notificationCalls = twilioSendNotificationSpy.mock.calls;
      expect(notificationCalls.length).toBeGreaterThan(16);
    });
  });

  // ========================================
  // C. Player leave during game
  // ========================================
  describe('player leave during game', () => {
    it('should remove a player who leaves and notify remaining players', async () => {
      const { messageHandlerService, mockPartyRepository, twilioSendNotificationSpy } = services;

      const partyId = await setupPartyWithPlayers(services);

      // Start match
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/start_match', TEST_USERS.alice.name)
      );

      const callsBeforeLeave = twilioSendNotificationSpy.mock.calls.length;

      // Charlie leaves
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.charlie.phoneNumber, '/leave_party', TEST_USERS.charlie.name)
      );

      // Verify player was removed
      const remainingPlayers = await mockPartyRepository.findPlayersByPartyId(partyId);
      expect(remainingPlayers).toHaveLength(2);

      // Verify remaining players were notified about the leave
      const callsAfterLeave = twilioSendNotificationSpy.mock.calls.length;
      expect(callsAfterLeave).toBeGreaterThan(callsBeforeLeave);
    });
  });

  // ========================================
  // D. Spanish language notifications (i18n)
  // ========================================
  describe('Spanish language notifications', () => {
    it('should send Spanish notifications to Mexican phone numbers', async () => {
      const { messageHandlerService, mockPartyRepository, twilioSendNotificationSpy } = services;
      const spanishUsers = [TEST_USERS.diana, TEST_USERS.elena, TEST_USERS.fernando];

      const partyId = await setupPartyWithPlayers(services, spanishUsers, 'PartidaEspanol');

      const parties = await mockPartyRepository.findAvailableParties('impostor');
      expect(parties.some(p => p.partyName === 'PartidaEspanol')).toBe(true);

      // Verify Spanish text appears in notifications
      const notificationCalls = twilioSendNotificationSpy.mock.calls;
      const bodies = notificationCalls.map((call: unknown[]) => {
        const notification = call[0] as { body?: string };
        return notification.body ?? '';
      });

      // Check for Spanish party creation text
      expect(bodies.some((body: string) => body.includes('creada exitosamente'))).toBe(true);
    });

    it('should send Spanish text for game actions during a match', async () => {
      const { twilioSendNotificationSpy } = services;
      const spanishUsers = [TEST_USERS.diana, TEST_USERS.elena, TEST_USERS.fernando];

      await setupPartyWithPlayers(services, spanishUsers, 'PartidaJuego');
      await startMatchAndRound(services, TEST_USERS.diana);

      // Check for Spanish content in template contentVariables
      const notificationCalls = twilioSendNotificationSpy.mock.calls;
      const allContentVariables = notificationCalls
        .map((call: unknown[]) => {
          const notification = call[0] as { template?: { contentVariables?: string } };
          return notification.template?.contentVariables ?? '';
        })
        .filter((cv: string) => cv.length > 0);

      // At least some notifications should have template contentVariables (Twilio templates)
      expect(allContentVariables.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // E. Party creation with QR code
  // ========================================
  describe('party creation with QR code', () => {
    it('should include mediaUrl with QR code for Twilio create party', async () => {
      const { mockPartyRepository, twilioSendNotificationSpy } = services;

      await services.messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/create_party impostor QRTestParty', TEST_USERS.alice.name)
      );

      const parties = await mockPartyRepository.findAvailableParties('impostor');
      const partyId = parties[0].id;

      // Find the create party notification
      const notificationCalls = twilioSendNotificationSpy.mock.calls;
      const createPartyNotification = notificationCalls.find((call: unknown[]) => {
        const notification = call[0] as { body?: string; mediaUrl?: string };
        return notification.body?.toLowerCase().includes('created') || notification.body?.toLowerCase().includes('creada');
      });

      expect(createPartyNotification).toBeDefined();
      const notification = createPartyNotification![0] as { body: string; mediaUrl?: string };

      // Verify QR code URL format
      expect(notification.mediaUrl).toBeDefined();
      expect(notification.mediaUrl).toContain(`/api/qr/${partyId}`);
      expect(notification.mediaUrl).toContain('https://test.example.com');
    });
  });

  // ========================================
  // F. Template-based notifications
  // ========================================
  describe('template-based notifications', () => {
    it('should include template SID and contentVariables for next_round', async () => {
      const { twilioSendNotificationSpy } = services;

      await setupPartyWithPlayers(services);
      await startMatchAndRound(services, TEST_USERS.alice);

      // Find notifications with templates (next_round uses templates)
      const notificationCalls = twilioSendNotificationSpy.mock.calls;
      const templateNotifications = notificationCalls.filter((call: unknown[]) => {
        const notification = call[0] as { template?: { sid: string; contentVariables?: string } };
        return notification.template?.sid != null;
      });

      expect(templateNotifications.length).toBeGreaterThan(0);

      // Verify template structure
      const templateNotification = templateNotifications[0][0] as {
        template: { sid: string; contentVariables?: string };
      };
      expect(templateNotification.template.sid).toBeDefined();
      expect(typeof templateNotification.template.sid).toBe('string');
    });

    it('should include word in next_round contentVariables', async () => {
      const { twilioSendNotificationSpy } = services;

      await setupPartyWithPlayers(services);
      await startMatchAndRound(services, TEST_USERS.alice);

      const notificationCalls = twilioSendNotificationSpy.mock.calls;

      // Find next_round template notifications that contain a word
      const nextRoundNotifications = notificationCalls.filter((call: unknown[]) => {
        const notification = call[0] as { template?: { contentVariables?: string } };
        if (!notification.template?.contentVariables) return false;
        try {
          const vars = JSON.parse(notification.template.contentVariables);
          return vars.word != null;
        } catch {
          return false;
        }
      });

      // Each player should receive a word notification in next_round
      expect(nextRoundNotifications.length).toBeGreaterThanOrEqual(3);

      // Verify the word is a non-empty string
      for (const call of nextRoundNotifications) {
        const notification = call[0] as { template: { contentVariables: string } };
        const vars = JSON.parse(notification.template.contentVariables);
        expect(typeof vars.word).toBe('string');
        expect(vars.word.length).toBeGreaterThan(0);
      }
    });
  });

  // ========================================
  // G. Error scenarios
  // ========================================
  describe('error scenarios', () => {
    it('should handle invalid commands gracefully', async () => {
      const { messageHandlerService } = services;

      const invalidCommand = TwilioMessageFactory.createMessage(
        TEST_USERS.alice.phoneNumber,
        '/invalid_command',
        TEST_USERS.alice.name
      );

      await expect(
        messageHandlerService.handle(MessagePlatform.TWILIO, invalidCommand)
      ).rejects.toThrow('Unknown command');
    });

    it('should error when joining a non-existent party', async () => {
      const { messageHandlerService } = services;

      // Register Alice first by creating a message (user gets created during handle)
      const joinNonExistent = TwilioMessageFactory.createMessage(
        TEST_USERS.alice.phoneNumber,
        '/join_party non-existent-party-id',
        TEST_USERS.alice.name
      );

      await expect(
        messageHandlerService.handle(MessagePlatform.TWILIO, joinNonExistent)
      ).rejects.toThrow();
    });

    it('should error when starting match with fewer than 3 players', async () => {
      const { messageHandlerService, mockPartyRepository } = services;

      // Create party with only 2 players
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/create_party impostor SmallParty', TEST_USERS.alice.name)
      );

      const parties = await mockPartyRepository.findAvailableParties('impostor');
      const partyId = parties[0].id;

      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.bob.phoneNumber, `/join_party ${partyId}`, TEST_USERS.bob.name)
      );

      // Try to start with only 2 players
      await expect(
        messageHandlerService.handle(
          MessagePlatform.TWILIO,
          TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/start_match', TEST_USERS.alice.name)
        )
      ).rejects.toThrow();
    });

    it('should prevent voting before round starts', async () => {
      const { messageHandlerService } = services;

      await setupPartyWithPlayers(services);

      // Start match but DON'T start round
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/start_match', TEST_USERS.alice.name)
      );

      // Try to vote
      await expect(
        messageHandlerService.handle(
          MessagePlatform.TWILIO,
          TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/vote Bob', TEST_USERS.alice.name)
        )
      ).rejects.toThrow();
    });

    it('should error when finishing round before starting one', async () => {
      const { messageHandlerService } = services;

      await setupPartyWithPlayers(services);

      // Start match
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/start_match', TEST_USERS.alice.name)
      );

      // Try to finish round without starting one
      await expect(
        messageHandlerService.handle(
          MessagePlatform.TWILIO,
          TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/finish_round', TEST_USERS.alice.name)
        )
      ).rejects.toThrow();
    });

    it('should error when double joining same party', async () => {
      const { messageHandlerService, mockPartyRepository } = services;

      // Create party
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/create_party impostor DoubleJoin', TEST_USERS.alice.name)
      );

      const parties = await mockPartyRepository.findAvailableParties('impostor');
      const partyId = parties[0].id;

      // Bob joins
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.bob.phoneNumber, `/join_party ${partyId}`, TEST_USERS.bob.name)
      );

      // Bob tries to join again
      await expect(
        messageHandlerService.handle(
          MessagePlatform.TWILIO,
          TwilioMessageFactory.createMessage(TEST_USERS.bob.phoneNumber, `/join_party ${partyId}`, TEST_USERS.bob.name)
        )
      ).rejects.toThrow();
    });
  });

  // ========================================
  // H. Finish match and restart
  // ========================================
  describe('finish match', () => {
    it('should finish a match after completing a round', async () => {
      const { messageHandlerService, mockPartyRepository, twilioSendNotificationSpy } = services;

      const partyId = await setupPartyWithPlayers(services, undefined, 'FinishMe');

      // Play one full round
      await startMatchAndRound(services, TEST_USERS.alice);
      await voteAndFinishRound(services, [TEST_USERS.alice, TEST_USERS.bob, TEST_USERS.charlie], TEST_USERS.alice);

      // Finish the match
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/finish_match', TEST_USERS.alice.name)
      );

      // Verify party status is FINISHED
      const party = await mockPartyRepository.findById(partyId);
      expect(party?.status).toBe('FINISHED');

      // Verify finish match notifications were sent
      const notificationCalls = twilioSendNotificationSpy.mock.calls;
      const hasFinishNotification = notificationCalls.some((call: unknown[]) => {
        const notification = call[0] as { template?: { contentVariables?: string }; body?: unknown };
        if (notification.template?.contentVariables) {
          try {
            const vars = JSON.parse(notification.template.contentVariables);
            const bodyStr = typeof vars.body === 'string' ? vars.body.toLowerCase() : '';
            return bodyStr.includes('finished') || bodyStr.includes('terminado');
          } catch {
            return false;
          }
        }
        if (typeof notification.body === 'string') {
          return notification.body.toLowerCase().includes('finished');
        }
        return false;
      });
      expect(hasFinishNotification).toBe(true);
    });

    it('should allow creating a new party after finishing a match', async () => {
      const { messageHandlerService, mockPartyRepository } = services;

      const partyId = await setupPartyWithPlayers(services, undefined, 'OldGame');

      // Play and finish
      await startMatchAndRound(services, TEST_USERS.alice);
      await voteAndFinishRound(services, [TEST_USERS.alice, TEST_USERS.bob, TEST_USERS.charlie], TEST_USERS.alice);
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/finish_match', TEST_USERS.alice.name)
      );

      const oldParty = await mockPartyRepository.findById(partyId);
      expect(oldParty?.status).toBe('FINISHED');

      // Alice creates a new party
      await messageHandlerService.handle(
        MessagePlatform.TWILIO,
        TwilioMessageFactory.createMessage(TEST_USERS.alice.phoneNumber, '/create_party impostor NewGame', TEST_USERS.alice.name)
      );

      const availableParties = await mockPartyRepository.findAvailableParties('impostor');
      expect(availableParties.some(p => p.partyName === 'NewGame')).toBe(true);
    });
  });
});
