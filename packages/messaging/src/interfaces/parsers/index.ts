import { FinishRoundParams, MiddleRoundActionParams, ValidGameNames } from "@phone-games/games";
import { NextRoundParams } from "@phone-games/games";
import { WhatsAppIncomingMessage } from "./whatsapp";
import { TwilioIncomingMessage } from "./twilio";

export enum MessagePlatform {
    WHATSAPP = 'whatsapp',
    TWILIO = 'twilio',
  }

export enum ValidActions {
  CREATE_PARTY = 'create_party',
  JOIN_PARTY = 'join_party',
  LEAVE_PARTY = 'leave_party',
  START_MATCH = 'start_match',
  NEXT_ROUND = 'next_round',
  MIDDLE_ROUND_ACTION = 'middle_round_action',
  FINISH_ROUND = 'finish_round',
  FINISH_MATCH = 'finish_match',
}
export type IncomingMessage<T extends MessagePlatform> = {
  [MessagePlatform.WHATSAPP]: WhatsAppIncomingMessage;
  [MessagePlatform.TWILIO]: TwilioIncomingMessage;
}[T];

export type CreatePartyParams = {
  gameName: ValidGameNames;
  partyName: string;
}
export type JoinPartyParams = {
  partyId: string;
}

export type DataOutput = {
  [ValidActions.CREATE_PARTY]: CreatePartyParams,
  [ValidActions.JOIN_PARTY]: JoinPartyParams,
  [ValidActions.LEAVE_PARTY]: Record<string, never>,
  [ValidActions.START_MATCH]: Record<string, never>,
  [ValidActions.NEXT_ROUND]: NextRoundParams<ValidGameNames>,
  [ValidActions.MIDDLE_ROUND_ACTION]: MiddleRoundActionParams<ValidGameNames>,
  [ValidActions.FINISH_ROUND]: FinishRoundParams<ValidGameNames>,
  [ValidActions.FINISH_MATCH]: Record<string, never>,
}

/**
 * Simplified parser output
 * Parsers only extract platform-specific data (text and user info)
 * Commands handle action matching and param parsing
 */
export type Output = {
  text: string;
  user: {
    id: string;
    username: string;
    phoneNumber: string;
  }
}

/**
 * Legacy Output type with action and dataOutput
 * Kept for backward compatibility during migration
 * @deprecated Use simplified Output type instead
 */
export type LegacyOutput<T extends ValidActions> = {
  action: T;
  user: {
    id: string;
    username: string;
    phoneNumber: string;
  }
  dataOutput: DataOutput[T];
}

export abstract class IncomingMessageParser<T extends MessagePlatform = MessagePlatform> {
  abstract parse(message: IncomingMessage<T>): Promise<Output>;
  abstract getMessagePlatform(): MessagePlatform;
}