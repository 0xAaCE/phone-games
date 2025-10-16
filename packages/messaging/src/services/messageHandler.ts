import { User } from "@phone-games/db";
import { MessageHandler } from "../interfaces/messageHandler";
import { NotificationProvider, NotificationService, WhatsappNotificationProvider, TwilioWhatsAppNotificationProvider } from "@phone-games/notifications";
import { PartyManagerService } from "@phone-games/party";
import { UserService } from "@phone-games/user";
import { FinishRoundParams, GameFactory, MiddleRoundActionParams, NextRoundParams, ValidGameNames } from "@phone-games/games";
import { ILogger } from "@phone-games/logger";

import { CreatePartyParams, IncomingMessage, IncomingMessageParser, JoinPartyParams, MessagePlatform, Output, ValidActions } from "../interfaces/parsers/index.js";
import { WhatsAppIncomingMessage } from "../interfaces/parsers/whatsapp.js";
import { MessageParsingError, ExternalServiceError } from "@phone-games/errors";


export class MessageHandlerService implements MessageHandler {
  private partyManagerService: PartyManagerService;
  private userService: UserService;
  private parsers: Map<MessagePlatform, IncomingMessageParser>;
  private notificationService: NotificationService;
  private logger: ILogger;

  constructor(
    notificationService: NotificationService,
    partyManagerService: PartyManagerService,
    userService: UserService,
    parsers: IncomingMessageParser[],
    logger: ILogger
  ) {
    this.notificationService = notificationService;
    this.partyManagerService = partyManagerService;
    this.userService = userService;
    this.parsers = new Map(parsers.map(parser => [parser.getMessagePlatform(), parser]));
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

    const output = await parser.parse(message);
    this.logger.info('Message parsed successfully', { action: output.action, userId: output.user.id });

    await this.handleUser(messagePlatform, output);

    switch (output.action) {
      case ValidActions.CREATE_PARTY: {
        const createPartyParams = output.dataOutput as CreatePartyParams;
        await this.partyManagerService.createParty(output.user.id, createPartyParams.partyName, GameFactory.createGame(createPartyParams.gameName));
        break;
      }
      case ValidActions.JOIN_PARTY: {
        const joinPartyParams = output.dataOutput as JoinPartyParams;
        await this.partyManagerService.joinParty(output.user.id, joinPartyParams.partyId);
        break;
      }
      case ValidActions.LEAVE_PARTY:
        await this.partyManagerService.leaveParty(output.user.id);
        break;
      case ValidActions.START_MATCH:
        await this.partyManagerService.startMatch(output.user.id);
        break;
      case ValidActions.NEXT_ROUND: {
        const nextRoundParams = output.dataOutput as NextRoundParams<ValidGameNames>;
        await this.partyManagerService.nextRound(output.user.id, nextRoundParams);
        break;
      }
      case ValidActions.MIDDLE_ROUND_ACTION: {
        const middleRoundActionParams = output.dataOutput as MiddleRoundActionParams<ValidGameNames>;
        await this.partyManagerService.middleRoundAction(output.user.id, middleRoundActionParams);
        break;
      }
      case ValidActions.FINISH_ROUND: {
        const finishRoundParams = output.dataOutput as FinishRoundParams<ValidGameNames>;
        await this.partyManagerService.finishRound(output.user.id, finishRoundParams);
        break;
      }
      case ValidActions.FINISH_MATCH:
        await this.partyManagerService.finishMatch(output.user.id);
        break;
    }

    return;
  }

  private async handleUser(messagePlatform: MessagePlatform, output: Output<ValidActions>) {
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