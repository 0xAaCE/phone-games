import { CreatePartyParams, DataOutput, IncomingMessage, IncomingMessageParser, JoinPartyParams, MessagePlatform, Output, ValidActions } from "../interfaces/parsers";
import { WhatsAppIncomingMessage } from "../interfaces/parsers/whatsapp";
import { FinishRoundParams, MiddleRoundActionParams, NextRoundParams, ValidGameNames } from "@phone-games/games";
import { UserService } from "@phone-games/user";
import { waIdToUserId } from "../utils/uuid.js";

export class WhatsAppParser implements IncomingMessageParser<MessagePlatform.WHATSAPP> {

    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    getMessagePlatform(): MessagePlatform {
        return MessagePlatform.WHATSAPP;
    }

    async parse(message: IncomingMessage<MessagePlatform.WHATSAPP>): Promise<Output<ValidActions>> {
        const action = await this.parseAction(message);
        const dataOutput = await this.parseDataOutput(action, message);
        const user = await this.parseUser(message);
        return { action, user, dataOutput };
    }

    private async parseAction(message: WhatsAppIncomingMessage): Promise<ValidActions> {
        const text = message.entry[0].changes[0].value.messages[0].text.body;
        
        // Array of regex patterns with their corresponding actions
        const actionPatterns = [
            { regex: /\/create_party/, action: ValidActions.CREATE_PARTY },
            { regex: /\/join_party/, action: ValidActions.JOIN_PARTY },
            { regex: /\/leave_party/, action: ValidActions.LEAVE_PARTY },
            { regex: /\/start_match/, action: ValidActions.START_MATCH },
            { regex: /\/next_round/, action: ValidActions.NEXT_ROUND },
            { regex: /\/(middle_round_action|vote)/, action: ValidActions.MIDDLE_ROUND_ACTION },
            { regex: /\/finish_round/, action: ValidActions.FINISH_ROUND },
            { regex: /\/finish_match/, action: ValidActions.FINISH_MATCH }
        ];
        
        // Find the first matching pattern
        const matchedPattern = actionPatterns.find(pattern => pattern.regex.test(text));
        
        if (matchedPattern) {
            return matchedPattern.action;
        }
        
        throw new Error(`Unknown action in message: ${text}`);
    }

    private async parseUser(message: WhatsAppIncomingMessage): Promise<{ id: string, username: string, phoneNumber: string }> {
        const waId = message.entry[0].changes[0].value.contacts[0].wa_id;
        const id = waIdToUserId(waId); // Convert wa_id to deterministic UUID
        const username = message.entry[0].changes[0].value.contacts[0].profile.name;
        const phoneNumber = waId;
        return { id, username, phoneNumber };
    }

    private async parseDataOutput<T extends ValidActions>(action: T, message: WhatsAppIncomingMessage): Promise<DataOutput[T]> {
        switch (action) {
            case ValidActions.CREATE_PARTY:
                return this.parseCreatePartyParams(message) as Promise<DataOutput[T]>;
            case ValidActions.JOIN_PARTY:
                return this.parseJoinPartyParams(message) as Promise<DataOutput[T]>;
            case ValidActions.LEAVE_PARTY:
                return this.parseLeavePartyParams(message) as Promise<DataOutput[T]>;
            case ValidActions.START_MATCH:
                return this.parseStartMatchParams(message) as Promise<DataOutput[T]>;
            case ValidActions.NEXT_ROUND:
                return this.parseNextRoundParams(message) as Promise<DataOutput[T]>;
            case ValidActions.MIDDLE_ROUND_ACTION:
                return this.parseMiddleRoundActionParams(message) as Promise<DataOutput[T]>;
            case ValidActions.FINISH_ROUND:
                return this.parseFinishRoundParams(message) as Promise<DataOutput[T]>;
            case ValidActions.FINISH_MATCH:
                return this.parseFinishMatchParams(message) as Promise<DataOutput[T]>;
            default:
                throw new Error("Invalid action");
        }
    }

    private async parseCreatePartyParams(message: WhatsAppIncomingMessage): Promise<CreatePartyParams> {
        const text = message.entry[0].changes[0].value.messages[0].text.body;
        const [_action, gameName, partyName] = text.split(' ');
        return { gameName: gameName as ValidGameNames, partyName };
    }

    private async parseJoinPartyParams(message: WhatsAppIncomingMessage): Promise<JoinPartyParams> {
        const text = message.entry[0].changes[0].value.messages[0].text.body;
        const [_action, partyId] = text.split(' ');
        return { partyId };
    }

    private async parseLeavePartyParams(_message: WhatsAppIncomingMessage): Promise<Record<string, never>> {
        return {};
    }

    private async parseStartMatchParams(_message: WhatsAppIncomingMessage): Promise<Record<string, never>> {
        return {};
    }

    private async parseNextRoundParams(message: WhatsAppIncomingMessage): Promise<NextRoundParams<ValidGameNames>> {
        const waId = message.entry[0].changes[0].value.contacts[0].wa_id;
        const userId = waIdToUserId(waId);
        return { userId };
    }

    private async parseMiddleRoundActionParams(message: WhatsAppIncomingMessage): Promise<MiddleRoundActionParams<ValidGameNames>> {
        const text = message.entry[0].changes[0].value.messages[0].text.body;
        const [_action, vote] = text.split(' ');
        const waId = message.entry[0].changes[0].value.contacts[0].wa_id;
        const userId = waIdToUserId(waId);

        const user = await this.userService.getUserByUsername(vote);
        if (!user) {
            throw new Error("User not found");
        }

        return { votes: { [userId]: user.id } };
    }

    private async parseFinishRoundParams(_message: WhatsAppIncomingMessage): Promise<FinishRoundParams<ValidGameNames>> {
        return {};
    }

    private async parseFinishMatchParams(_message: WhatsAppIncomingMessage): Promise<Record<string, never>> {
        return {};
    }
}