import { User } from "@phone-games/db";
import { MessageHandler } from "../interfaces/messageHandler";
import { NotificationProvider, NotificationService, WhatsappNotificationProvider, TwilioWhatsAppNotificationProvider } from "@phone-games/notifications";
import { PartyManagerService } from "@phone-games/party";
import { UserService } from "@phone-games/user";
import { ILogger } from "@phone-games/logger";

import { IncomingMessage, IncomingMessageParser, MessagePlatform, Output } from "../interfaces/parsers/index.js";
import { WhatsAppIncomingMessage } from "../interfaces/parsers/whatsapp.js";
import { MessageParsingError, ExternalServiceError } from "@phone-games/errors";
import { GameCommandFactory } from "../commands/index.js";


export class MessageHandlerService implements MessageHandler {
  private userService: UserService;
  private parsers: Map<MessagePlatform, IncomingMessageParser>;
  private notificationService: NotificationService;
  private commandFactory: GameCommandFactory;
  private logger: ILogger;

  constructor(
    notificationService: NotificationService,
    partyManagerService: PartyManagerService,
    userService: UserService,
    parsers: IncomingMessageParser[],
    logger: ILogger
  ) {
    this.notificationService = notificationService;
    this.userService = userService;
    this.parsers = new Map(parsers.map(parser => [parser.getMessagePlatform(), parser]));
    this.commandFactory = new GameCommandFactory(partyManagerService, userService);
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

    const parser = this.parsers.get(messagePlatform);

    if (!parser) {
      this.logger.error('Parser not found for message platform', undefined, { messagePlatform });
      throw new MessageParsingError(`Parser not found for message platform: ${messagePlatform}`);
    }

    // Parse message - extract text and user info
    const output = await parser.parse(message);
    this.logger.info('Message parsed successfully', { text: output.text, userId: output.user.id });

    // Handle user registration/notification setup
    await this.handleUser(messagePlatform, output);

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
  }

  private async handleUser(messagePlatform: MessagePlatform, output: Output) {
    let user = await this.userService.getUserById(output.user.id);
    if (!user) {
        user = await this.userService.createUser(output.user);
    }

    if (this.notificationService.hasUser(output.user.id)) {
      return user;
    }

    await this.notificationService.registerUser(output.user.id, this.getMessageProvider(messagePlatform, user));
    return user;
  }

  private getMessageProvider(messagePlatform: MessagePlatform, user: User): NotificationProvider {
    switch (messagePlatform) {
      case MessagePlatform.WHATSAPP: {
        const apiUrl = process.env.WHATSAPP_API_URL;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const apiToken = process.env.WHATSAPP_API_TOKEN;
        if (!apiUrl || !phoneNumberId || !apiToken) {
          throw new ExternalServiceError('Missing required WhatsApp environment variables');
        }
        return new WhatsappNotificationProvider(apiUrl, phoneNumberId, apiToken, user);
      }
      case MessagePlatform.TWILIO: {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
        if (!accountSid || !authToken || !whatsappFrom) {
          throw new ExternalServiceError('Missing required Twilio environment variables');
        }
        return new TwilioWhatsAppNotificationProvider(accountSid, authToken, whatsappFrom, user);
      }
      default:
        throw new MessageParsingError(`Message platform not supported: ${messagePlatform}`);
    }
  }
}