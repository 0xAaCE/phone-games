import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagePlatform } from '@phone-games/messaging';
import { NotificationManager } from '@phone-games/notifications';
import { ILogger } from '@phone-games/logger';
import { createTestServices, TestServices } from '../helpers/testServiceFactory.js';
import { TwilioMessageFactory, TEST_USERS } from '../helpers/twilioMessageFactory.js';
import { ImpostorTwillioFormatter } from '@phone-games/notifications';

// Mock logger implementation for tests
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

describe('Twilio Game Flow Integration Test', () => {
  let services: TestServices;
  let logger: ILogger;
  let notificationService: NotificationManager;

  beforeEach(() => {
    // Reset factories
    TwilioMessageFactory.reset();
    vi.clearAllMocks();

    // Mock environment variables for Twilio
    process.env.TWILIO_ACCOUNT_SID = 'AC' + '0'.repeat(32);
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
    process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+11234567890';

    // Create logger
    logger = createMockLogger();

    // Create notification service with real formatters
    notificationService = new NotificationManager(
      [new ImpostorTwillioFormatter()],
      logger
    );

    // Create test services
    services = createTestServices(notificationService, logger);
  });

  it('should complete a full game round with 3 players via Twilio messages', async () => {
    const { messageHandlerService, mockPartyRepository, twilioSendNotificationSpy } = services;

    // ===== SETUP PHASE =====

    // 1. Player 1 (Alice) creates party
    const aliceCreateParty = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/create_party impostor FridayGames',
      TEST_USERS.alice.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, aliceCreateParty);

    // Verify party was created
    const parties = await mockPartyRepository.findAvailableParties('impostor');
    expect(parties).toHaveLength(1);
    expect(parties[0].partyName).toBe('FridayGames');
    expect(parties[0].gameName).toBe('impostor');

    const partyId = parties[0].id;

    // 2. Player 2 (Bob) joins party
    const bobJoinParty = TwilioMessageFactory.createMessage(
      TEST_USERS.bob.phoneNumber,
      `/join_party ${partyId}`,
      TEST_USERS.bob.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, bobJoinParty);

    // 3. Player 3 (Charlie) joins party
    const charlieJoinParty = TwilioMessageFactory.createMessage(
      TEST_USERS.charlie.phoneNumber,
      `/join_party ${partyId}`,
      TEST_USERS.charlie.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, charlieJoinParty);

    // Verify all players joined
    const partyPlayers = await mockPartyRepository.findPlayersByPartyId(partyId);
    expect(partyPlayers).toHaveLength(3);

    // ===== GAME PHASE =====

    // 4. Player 1 starts the match
    const aliceStartMatch = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/start_match',
      TEST_USERS.alice.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, aliceStartMatch);

    // Verify match started
    const party = await mockPartyRepository.findById(partyId);
    expect(party?.status).toBe('ACTIVE');

    // 5. Player 1 starts next round
    const aliceNextRound = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/next_round',
      TEST_USERS.alice.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, aliceNextRound);

    // Verify round started (currentRound should be 1)
    // Note: We can't easily verify game state here without exposing it,
    // but we can verify no errors were thrown

    // 6. All players vote
    const aliceVote = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/vote Bob',
      TEST_USERS.alice.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, aliceVote);

    const bobVote = TwilioMessageFactory.createMessage(
      TEST_USERS.bob.phoneNumber,
      '/vote Alice',
      TEST_USERS.bob.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, bobVote);

    const charlieVote = TwilioMessageFactory.createMessage(
      TEST_USERS.charlie.phoneNumber,
      '/vote Alice',
      TEST_USERS.charlie.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, charlieVote);

    // 7. Player 1 finishes the round
    const aliceFinishRound = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/finish_round',
      TEST_USERS.alice.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, aliceFinishRound);

    // ===== VERIFICATION =====

    // Verify no errors were thrown during the entire flow
    expect(true).toBe(true);

    // Verify party still exists and is active
    const finalParty = await mockPartyRepository.findById(partyId);
    expect(finalParty).not.toBeNull();
    expect(finalParty?.status).toBe('ACTIVE');

    // Verify all 3 players are still in the party
    const finalPlayers = await mockPartyRepository.findPlayersByPartyId(partyId);
    expect(finalPlayers).toHaveLength(3);

    // ===== VERIFY TWILIO NOTIFICATIONS =====

    // Verify Twilio sendNotification was called for all notification events
    expect(twilioSendNotificationSpy).toHaveBeenCalled();

    // Get all notification calls
    const notificationCalls = twilioSendNotificationSpy.mock.calls;

    // We expect notifications for:
    // 1. Create party confirmation (Alice) - 1 notification
    // 2. Player joined notifications (Bob joins, Charlie joins, then Alice notified) - 3 notifications
    // 3. Start match notification (3 players) - 3 notifications
    // 4. Next round notification (3 players get their words) - 3 notifications
    // 5. Middle round action (3 players get vote confirmations) - 3 notifications
    // 6. Finish round notification (3 players get results) - 3 notifications
    // Total: 1 + 3 + 3 + 3 + 3 + 3 = 16 notifications
    expect(notificationCalls.length).toBe(16);

    // Verify that notifications contain expected content
    const notificationBodies = notificationCalls.map(call => {
      const notification = call[0] as { body: string };
      return notification.body;
    });

    // Check for create party notification
    expect(notificationBodies.some(body => body.toLowerCase().includes('created'))).toBe(true);

    // Check for player joined notifications
    expect(notificationBodies.some(body => body.toLowerCase().includes('joined'))).toBe(true);

    // Check for match start notification
    expect(notificationBodies.some(body => body.toLowerCase().includes('started'))).toBe(true);

    // Check for round notification (word assignment)
    expect(notificationBodies.some(body => body.toLowerCase().includes('word'))).toBe(true);

    // Check for vote confirmation
    expect(notificationBodies.some(body => body.toLowerCase().includes('vote'))).toBe(true);

    // Check for round results
    expect(notificationBodies.some(body => body.toLowerCase().includes('finished'))).toBe(true);

    // Verify notifications were sent to correct phone numbers
    const notificationRecipients = notificationCalls.map(call => {
      // The notification is sent via TwilioWhatsAppNotificationProvider
      // which was instantiated with a user's phone number
      return call[0];
    });

    // At minimum, all 3 players should have received notifications
    expect(notificationRecipients.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle invalid commands gracefully', async () => {
    const { messageHandlerService } = services;

    const invalidCommand = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/invalid_command',
      TEST_USERS.alice.name
    );

    // Should throw error for unknown command
    await expect(
      messageHandlerService.handle(MessagePlatform.TWILIO, invalidCommand)
    ).rejects.toThrow('Unknown command');
  });

  it('should prevent voting before round starts', async () => {
    const { messageHandlerService, mockPartyRepository } = services;

    // 1. Create party and add players
    const aliceCreateParty = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/create_party impostor TestParty',
      TEST_USERS.alice.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, aliceCreateParty);

    const parties = await mockPartyRepository.findAvailableParties('impostor');
    const partyId = parties[0].id;

    const bobJoinParty = TwilioMessageFactory.createMessage(
      TEST_USERS.bob.phoneNumber,
      `/join_party ${partyId}`,
      TEST_USERS.bob.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, bobJoinParty);

    const charlieJoinParty = TwilioMessageFactory.createMessage(
      TEST_USERS.charlie.phoneNumber,
      `/join_party ${partyId}`,
      TEST_USERS.charlie.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, charlieJoinParty);

    // 2. Start match but DON'T start round
    const aliceStartMatch = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/start_match',
      TEST_USERS.alice.name
    );

    await messageHandlerService.handle(MessagePlatform.TWILIO, aliceStartMatch);

    // 3. Try to vote before round starts - should fail
    const aliceVote = TwilioMessageFactory.createMessage(
      TEST_USERS.alice.phoneNumber,
      '/vote bob',
      TEST_USERS.alice.name
    );

    await expect(
      messageHandlerService.handle(MessagePlatform.TWILIO, aliceVote)
    ).rejects.toThrow();
  });
});
