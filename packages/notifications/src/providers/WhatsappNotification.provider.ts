import { User } from "@phone-games/db";
import { Notification, NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/Notification.js";
import { NotificationProvider } from "../interfaces/NotificationProvider.js";

export class WhatsappNotificationProvider extends NotificationProvider {
    private apiUrl: string;
    private apiToken: string;
    private recipientPhoneNumber: string;

    constructor(apiUrl: string, apiToken: string, to: User) {
        if (!to.phoneNumber) {
            throw new Error('User does not have a phone number');
        }

        super();
        this.apiUrl = apiUrl;
        this.apiToken = apiToken;
        this.recipientPhoneNumber = to.phoneNumber;
    }

    async sendNotification(notification: Notification): Promise<void> {
        const message = this.formatMessage(notification);

        try {
            const response = await fetch(`${this.apiUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`,
                },
                body: JSON.stringify({
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
            console.error('Failed to send WhatsApp notification:', error);
            throw error;
        }
    }

    private formatMessage(notification: Notification): string {
        return `*${notification.title}*\n\n${notification.body}`;
    }

    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.WHATSAPP;
    }
}
