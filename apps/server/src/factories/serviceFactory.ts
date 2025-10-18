import { PrismaClient } from '@phone-games/db';
import { ILogger } from '@phone-games/logger';
import { NotificationService } from '@phone-games/notifications';
import { PartyManagerService } from '@phone-games/party';
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
 * Service Factory
 * Centralizes service instantiation and dependency wiring.
 * Makes the dependency graph clear and explicit.
 */
export function createServices(deps: ServiceFactoryDependencies): Services {
  const { db, logger, notificationService } = deps;

  // Create repositories
  const userRepository = new PrismaUserRepository(db);
  const partyRepository = new PrismaPartyRepository(db);

  // Create core services
  const userService = new UserService(userRepository);

  const partyManagerService = new PartyManagerService(
    partyRepository,
    notificationService,
    logger
  );

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
