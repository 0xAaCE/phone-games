import { IncomingMessage, IncomingMessageParser, MessagePlatform, Output } from "../interfaces/parsers/index.js";
import { WhatsAppIncomingMessage } from "../interfaces/parsers/whatsapp.js";
import { waIdToUserId } from "../utils/uuid.js";

/**
 * WhatsApp message parser
 * Simplified: Only extracts text and user info from WhatsApp-specific message format
 * Commands handle action matching and param parsing
 */
export class WhatsAppParser implements IncomingMessageParser<MessagePlatform.WHATSAPP> {
    getMessagePlatform(): MessagePlatform {
        return MessagePlatform.WHATSAPP;
    }

    async parse(message: IncomingMessage<MessagePlatform.WHATSAPP>): Promise<Output> {
        const whatsappMessage = message as WhatsAppIncomingMessage;

        // Extract message text
        const text = whatsappMessage.entry[0].changes[0].value.messages[0].text.body;

        // Extract user info
        const waId = whatsappMessage.entry[0].changes[0].value.contacts[0].wa_id;
        const id = waIdToUserId(waId);
        const username = whatsappMessage.entry[0].changes[0].value.contacts[0].profile.name;
        const phoneNumber = waId;

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
