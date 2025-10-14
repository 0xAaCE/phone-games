import { NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/Notification.js";
import { ImpostorWebSocketParser } from "./ImpostorWebSocketParser.js";

export class ImpostorWhatsAppParser extends ImpostorWebSocketParser {
    constructor() {
        super();
    }
    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.WHATSAPP;
    }
}