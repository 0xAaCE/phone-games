import { IncomingMessage, IncomingMessageParser, MessagePlatform, Output } from "../interfaces/parsers/index.js";
import { TwilioIncomingMessage } from "../interfaces/parsers/twilio.js";
import { waIdToUserId } from "../utils/uuid.js";

/**
 * Twilio message parser
 * Simplified: Only extracts text and user info from Twilio-specific message format
 * Commands handle action matching and param parsing
 */
export class TwilioParser implements IncomingMessageParser<MessagePlatform.TWILIO> {
    getMessagePlatform(): MessagePlatform {
        return MessagePlatform.TWILIO;
    }

    async parse(message: IncomingMessage<MessagePlatform.TWILIO>): Promise<Output> {
        const twilioMessage = message as TwilioIncomingMessage;

        // Extract message text
        const text = twilioMessage.Body;

        // Extract user info
        const from = twilioMessage.From.replace('whatsapp:+', '');
        const waId = twilioMessage.WaId || from;
        const id = waIdToUserId(waId);
        const username = twilioMessage.ProfileName || from;
        const phoneNumber = waId; // Use WaId if available, otherwise use extracted from

        return {
            text,
            user: {
                id,
                username,
                phoneNumber,
            },
        };
    }
}
