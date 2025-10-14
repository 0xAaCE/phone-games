import { PrismaClient, User } from "@phone-games/db";
import { MessageHandler } from "../interfaces/messageHandler";
import { NotificationProvider, NotificationService, WhatsappNotificationProvider } from "@phone-games/notifications";
import { PartyManagerService } from "@phone-games/party";
import { UserService } from "@phone-games/user";
import { FinishRoundParams, GameFactory, MiddleRoundActionParams, NextRoundParams, ValidGameNames } from "@phone-games/games";

import { CreatePartyParams, IncomingMessage, IncomingMessageParser, JoinPartyParams, MessagePlatform, Output, ValidActions } from "../interfaces/parsers/index.js";


export class MessageHandlerService implements MessageHandler {
  private partyManagerService: PartyManagerService;
  private userService: UserService;
  private parsers: Map<MessagePlatform, IncomingMessageParser>;
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService, partyManagerService: PartyManagerService, userService: UserService, parsers: IncomingMessageParser[]) {
    this.notificationService = notificationService;
    this.partyManagerService = partyManagerService;
    this.userService = userService;
    this.parsers = new Map(parsers.map(parser => [parser.getMessagePlatform(), parser]));
  }

  canHandle(messagePlatform: MessagePlatform, message: IncomingMessage<MessagePlatform>): boolean {
    return this.parsers.has(messagePlatform);
  }

  async handle(messagePlatform: MessagePlatform, message: IncomingMessage<MessagePlatform>): Promise<void> {
    const field = message.entry[0].changes[0].field;
    if (field !== "messages") {
      console.log("Field is not messages", field);
      return;
    }
    console.log("Message Received\n", JSON.stringify(message, null, 2));

    const parser = this.parsers.get(messagePlatform);
    if (!parser) {
      throw new Error(`Parser not found for message platform: ${messagePlatform}`);
    }
    const output = await parser.parse(message);

    await this.handleUser(messagePlatform, output);

    switch (output.action) {
      case ValidActions.CREATE_PARTY:
        const createPartyParams = output.dataOutput as CreatePartyParams;
        await this.partyManagerService.createParty(output.user.id, createPartyParams.partyName, GameFactory.createGame(createPartyParams.gameName));
        break;
      case ValidActions.JOIN_PARTY:
        const joinPartyParams = output.dataOutput as JoinPartyParams;
        await this.partyManagerService.joinParty(output.user.id, joinPartyParams.partyId);
        break;
      case ValidActions.LEAVE_PARTY:
        await this.partyManagerService.leaveParty(output.user.id);
        break;
      case ValidActions.START_MATCH:
        await this.partyManagerService.startMatch(output.user.id);
        break;
      case ValidActions.NEXT_ROUND:
        const nextRoundParams = output.dataOutput as NextRoundParams<ValidGameNames>;
        await this.partyManagerService.nextRound(output.user.id, nextRoundParams);
        break;
      case ValidActions.MIDDLE_ROUND_ACTION:
        const middleRoundActionParams = output.dataOutput as MiddleRoundActionParams<ValidGameNames>;
        await this.partyManagerService.middleRoundAction(output.user.id, middleRoundActionParams);
        break;
      case ValidActions.FINISH_ROUND:
        const finishRoundParams = output.dataOutput as FinishRoundParams<ValidGameNames>;
        await this.partyManagerService.finishRound(output.user.id, finishRoundParams);
        break;
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
      case MessagePlatform.WHATSAPP:
        return new WhatsappNotificationProvider(process.env.WHATSAPP_API_URL!, process.env.WHATSAPP_PHONE_NUMBER_ID!, process.env.WHATSAPP_API_TOKEN!, user);
      default:
        throw new Error(`Message platform not supported: ${messagePlatform}`);
    }
  }
}