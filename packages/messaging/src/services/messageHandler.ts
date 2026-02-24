import { MessageHandler } from "../interfaces/messageHandler";
import { NotificationService } from "@phone-games/notifications";
import { SessionCoordinator } from "@phone-games/party";
import { UserService } from "@phone-games/user";
import { ILogger } from "@phone-games/logger";
import { GAME_NAMES } from "@phone-games/games";

import { IncomingMessage, IncomingMessageParser, MessagePlatform, Output } from "../interfaces/parsers/index.js";
import { WhatsAppIncomingMessage } from "../interfaces/parsers/whatsapp.js";
import { MessageParsingError } from "@phone-games/errors";
import { GameCommandFactory } from "../commands/index.js";
import { UserRegistrationService } from "./userRegistrationService.js";


export class MessageHandlerService implements MessageHandler {
  private parsers: Map<MessagePlatform, IncomingMessageParser>;
  private notificationService: NotificationService;
  private userRegistrationService: UserRegistrationService;
  private commandFactory: GameCommandFactory;
  private logger: ILogger;

  constructor(
    notificationService: NotificationService,
    sessionCoordinator: SessionCoordinator,
    userService: UserService,
    userRegistrationService: UserRegistrationService,
    parsers: IncomingMessageParser[],
    logger: ILogger
  ) {
    this.notificationService = notificationService;
    this.userRegistrationService = userRegistrationService;
    this.parsers = new Map(parsers.map(parser => [parser.getMessagePlatform(), parser]));
    this.commandFactory = new GameCommandFactory(sessionCoordinator, userService, notificationService);
    this.logger = logger.child({ service: 'MessageHandlerService' });
  }

  canHandle(messagePlatform: MessagePlatform, message: IncomingMessage<MessagePlatform>): boolean {
    switch (messagePlatform) {
      case MessagePlatform.WHATSAPP: {
        const isMessageField = (message as WhatsAppIncomingMessage).entry[0].changes[0].field === "messages";
        return isMessageField;
      }
      case MessagePlatform.TWILIO:
        return this.parsers.has(MessagePlatform.TWILIO);
      default:
        return false;
    }
  }

  async handle(messagePlatform: MessagePlatform, message: IncomingMessage<MessagePlatform>): Promise<void> {
    this.logger.debug('Message received', { messagePlatform, message });

    let userId: string | undefined;

    try {
      const parser = this.parsers.get(messagePlatform);

      if (!parser) {
        this.logger.error('Parser not found for message platform', undefined, { messagePlatform });
        throw new MessageParsingError(`Parser not found for message platform: ${messagePlatform}`);
      }

      // Parse message - extract text and user info
      const output = await parser.parse(message);
      userId = output.user.id;
      this.logger.info('Message parsed successfully', { text: output.text, userId: output.user.id });

      // Handle user registration/notification setup
      await this.userRegistrationService.ensureUserRegistered(messagePlatform, output.user);

      // Command Pattern + Chain of Responsibility
      // Factory iterates through commands to find one that matches the text
      const command = await this.commandFactory.createCommand(output.text, output.user.id);

      // Optional validation before execution
      if (command.validate) {
        await command.validate();
      }

      // Execute the command
      await command.execute();
      this.logger.info('Command executed successfully', { text: output.text, userId: output.user.id });
    } catch (error) {
      // Convert error to user-friendly message
      const errorMessage = this.notificationService.convertErrorToMessage(error);
      this.logger.error('Error handling message', error as Error, { userId });

      // Send error notification if we have a userId
      if (userId) {
        try {
          await this.sendErrorNotification(userId, errorMessage);
        } catch (notificationError) {
          this.logger.error('Failed to send error notification', notificationError as Error, { userId });
        }
      }

      // Re-throw to be handled by caller if needed
      throw error;
    }
  }

  /**
   * Send error notification to user
   * Uses IMPOSTOR as default game since it's currently the only game
   */
  private async sendErrorNotification(userId: string, errorMessage: string): Promise<void> {
    await this.notificationService.notifyError(
      GAME_NAMES.IMPOSTOR,
      userId,
      errorMessage
    );
  }
}