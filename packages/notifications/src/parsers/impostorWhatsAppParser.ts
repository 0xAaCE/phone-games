import { NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/notification.js";
import { ImpostorWebSocketParser } from "./impostorWebSocketParser.js";

export class ImpostorWhatsAppParser extends ImpostorWebSocketParser {
    constructor() {
        super();
    }
    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.WHATSAPP;
    }
}