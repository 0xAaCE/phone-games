import { ILogger } from '@phone-games/logger';
import { NotificationService, TwilioWhatsAppNotificationProvider } from '@phone-games/notifications';
import {
  SessionCoordinator,
  PartyService,
  GameSessionManager,
  PlayerNotificationCoordinator,
  InMemoryGameStateStorage,
} from '@phone-games/party';
import { MessageHandlerService, UserRegistrationService, TwilioParser } from '@phone-games/messaging';
import { UserService } from '@phone-games/user';
import { MockUserRepository, MockPartyRepository } from './mockRepositories.js';
import { vi } from 'vitest';

export interface TestServices {
  userService: UserService;
  sessionCoordinator: SessionCoordinator;
  messageHandlerService: MessageHandlerService;
  mockUserRepository: MockUserRepository;
  mockPartyRepository: MockPartyRepository;
  notificationService: NotificationService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  twilioSendNotificationSpy: ReturnType<typeof vi.spyOn<any, any>>;
}

/**
 * Create services for integration testing with mocked dependencies
 *
 * Mocks:
 * - User and Party repositories (in-memory)
 * - Twilio API calls (vi.spyOn)
 *
 * Real implementations:
 * - All business logic (SessionCoordinator, commands, games)
 * - Notification formatting and delivery logic
 */
export function createTestServices(
  notificationService: NotificationService,
  logger: ILogger
): TestServices {
  // ===== Mock Repositories =====
  const mockUserRepository = new MockUserRepository();
  const mockPartyRepository = new MockPartyRepository();

  // Sync users between repositories
  // When a user is created in UserRepository, also add it to PartyRepository
  const originalCreate = mockUserRepository.create.bind(mockUserRepository);
  mockUserRepository.create = async (userData) => {
    const user = await originalCreate(userData);
    mockPartyRepository.seedUsers([user]);
    return user;
  };

  // ===== Core Services =====
  const userService = new UserService(mockUserRepository);

  // ===== Party Package Components =====
  // 1. Game state storage (in-memory)
  const gameStateStorage = new InMemoryGameStateStorage();

  // 2. Party service (party lifecycle)
  const partyService = new PartyService(mockPartyRepository, logger);

  // 3. Game session manager (game orchestration)
  const gameSessionManager = new GameSessionManager(gameStateStorage, logger);

  // 4. Player notification coordinator (broadcasting to players)
  const playerNotificationCoordinator = new PlayerNotificationCoordinator(
    notificationService,
    mockPartyRepository,
    logger
  );

  // 5. Session coordinator (mediator - coordinates all components)
  const sessionCoordinator = new SessionCoordinator(
    partyService,
    gameSessionManager,
    playerNotificationCoordinator,
    logger
  );

  // ===== Messaging Services =====
  // User registration service (handles user creation + notification provider setup)
  const userRegistrationService = new UserRegistrationService(
    userService,
    notificationService,
    logger
  );

  // Message handler service (orchestrates message processing)
  const messageHandlerService = new MessageHandlerService(
    notificationService,
    sessionCoordinator,
    userService,
    userRegistrationService,
    [new TwilioParser()],
    logger
  );

  // Mock Twilio API calls
  // This prevents actual HTTP requests to Twilio during tests
  const twilioSendNotificationSpy = vi
    .spyOn(TwilioWhatsAppNotificationProvider.prototype, 'sendNotification')
    .mockResolvedValue();

  return {
    userService,
    sessionCoordinator,
    messageHandlerService,
    mockUserRepository,
    mockPartyRepository,
    notificationService,
    twilioSendNotificationSpy,
  };
}
