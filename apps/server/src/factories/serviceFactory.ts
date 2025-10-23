import { PrismaClient } from '@phone-games/db';
import { ILogger } from '@phone-games/logger';
import { NotificationService } from '@phone-games/notifications';
import {
  SessionCoordinator,
  PartyService,
  GameSessionManager,
  PlayerNotificationCoordinator,
  InMemoryGameStateStorage,
} from '@phone-games/party';
import { MessageHandlerService, UserRegistrationService, WhatsAppParser, TwilioParser } from '@phone-games/messaging';
import { UserService } from '@phone-games/user';
import { PrismaUserRepository, PrismaPartyRepository } from '@phone-games/repositories';

export interface ServiceFactoryDependencies {
  db: PrismaClient;
  logger: ILogger;
  notificationService: NotificationService;
}

export interface Services {
  userService: UserService;
  sessionCoordinator: SessionCoordinator;
  messageHandlerService: MessageHandlerService;
  logger: ILogger;
}

/**
 * Service Factory - Updated for new architecture
 * Centralizes service instantiation and dependency wiring.
 * Makes the dependency graph clear and explicit.
 *
 * New architecture:
 * SessionCoordinator (Mediator) delegates to:
 *   - PartyService (party lifecycle)
 *   - GameSessionManager (game orchestration)
 *   - PlayerNotificationCoordinator (notifications)
 */
export function createServices(deps: ServiceFactoryDependencies): Services {
  const { db, logger, notificationService } = deps;

  // ===== Repositories =====
  const userRepository = new PrismaUserRepository(db);
  const partyRepository = new PrismaPartyRepository(db);

  // ===== Core Services =====
  const userService = new UserService(userRepository);

  // ===== Party Package Components =====
  // 1. Game state storage (in-memory for now, can swap with Redis/DB later)
  const gameStateStorage = new InMemoryGameStateStorage();

  // 2. Party service (party lifecycle)
  const partyService = new PartyService(partyRepository, logger);

  // 3. Game session manager (game orchestration)
  const gameSessionManager = new GameSessionManager(gameStateStorage, logger);

  // 4. Notification coordinator (broadcasting to players)
  const playerNotificationCoordinator = new PlayerNotificationCoordinator(
    notificationService,
    partyRepository,
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
    [new WhatsAppParser(), new TwilioParser()],
    logger
  );

  return {
    userService,
    sessionCoordinator,
    messageHandlerService,
    logger,
  };
}
