import { PrismaClient } from '@phone-games/db';
import { ILogger } from '@phone-games/logger';
import { NotificationService } from '@phone-games/notifications';
import {
  PartyManagerService,
  PartyService,
  GameSessionManager,
  PartyNotificationCoordinator,
  InMemoryGameStateStorage,
} from '@phone-games/party';
import { MessageHandlerService, WhatsAppParser, TwilioParser } from '@phone-games/messaging';
import { UserService } from '@phone-games/user';
import { PrismaUserRepository, PrismaPartyRepository } from '@phone-games/repositories';

export interface ServiceFactoryDependencies {
  db: PrismaClient;
  logger: ILogger;
  notificationService: NotificationService;
}

export interface Services {
  userService: UserService;
  partyManagerService: PartyManagerService;
  messageHandlerService: MessageHandlerService;
}

/**
 * Service Factory - Updated for new architecture
 * Centralizes service instantiation and dependency wiring.
 * Makes the dependency graph clear and explicit.
 *
 * New architecture:
 * PartyManagerService (Mediator) delegates to:
 *   - PartyService (party lifecycle)
 *   - GameSessionManager (game orchestration)
 *   - PartyNotificationCoordinator (notifications)
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
  const partyNotificationCoordinator = new PartyNotificationCoordinator(
    notificationService,
    partyRepository,
    logger
  );

  // 5. Party manager (mediator - coordinates all components)
  const partyManagerService = new PartyManagerService(
    partyService,
    gameSessionManager,
    partyNotificationCoordinator,
    logger
  );

  // ===== Messaging Service =====
  const messageHandlerService = new MessageHandlerService(
    notificationService,
    partyManagerService,
    userService,
    [new WhatsAppParser(userService), new TwilioParser(userService)],
    logger
  );

  return {
    userService,
    partyManagerService,
    messageHandlerService,
  };
}
