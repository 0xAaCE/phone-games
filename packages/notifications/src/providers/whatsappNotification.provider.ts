import { User } from "@phone-games/db";
import { ILogger } from "@phone-games/logger";
import { Notification, NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/notification.js";
import { NotificationProvider } from "../interfaces/notificationProvider.js";

export class WhatsappNotificationProvider extends NotificationProvider {
    private apiUrl: string;
    private apiToken: string;
    private sourcePhoneNumberId: string;
    private recipientPhoneNumber: string;
    private logger: ILogger;

    constructor(apiUrl: string, sourcePhoneNumberId: string, apiToken: string, to: User, logger: ILogger) {
        if (!to.phoneNumber) {
            throw new Error('User does not have a phone number');
        }

        super();
        this.apiUrl = apiUrl;
        this.apiToken = apiToken;
        this.sourcePhoneNumberId = sourcePhoneNumberId;
        this.recipientPhoneNumber = to.phoneNumber;
        this.logger = logger.child({ provider: 'WhatsappNotificationProvider', recipient: to.phoneNumber });
    }

    async sendNotification(notification: Notification): Promise<void> {
        const message = this.formatMessage(notification);

        try {
            const response = await fetch(`${this.apiUrl}/${this.sourcePhoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`,
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: this.recipientPhoneNumber,
                    type: 'text',
                    text: {
                        body: message,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`WhatsApp API error: ${response.statusText}`);
            }
        } catch (error) {
            this.logger.error('Failed to send WhatsApp notification', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    private formatMessage(notification: Notification): string {
        return `*${notification.title}*\n\n${notification.body}`;
    }

    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.WHATSAPP;
    }

    getPhoneNumber(): string | null {
        return this.recipientPhoneNumber;
    }

    getFromPhoneNumber(): string | null {
        // WhatsApp connections don't have phone numbers
        // Will default to English in formatters
        return null;
    }
}
