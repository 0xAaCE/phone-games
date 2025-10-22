import { User } from "@phone-games/db";
import { Notification, NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/notification.js";
import { NotificationProvider } from "../interfaces/notificationProvider.js";
import twilio from 'twilio';
import { ContentCreateRequest } from "twilio/lib/rest/content/v1/content.js";

export class TwilioWhatsAppNotificationProvider extends NotificationProvider {
    private client: twilio.Twilio;
    private fromPhoneNumber: string;
    private recipientPhoneNumber: string;

    constructor(accountSid: string, authToken: string, fromPhoneNumber: string, to: User) {
        if (!to.phoneNumber) {
            throw new Error('User does not have a phone number');
        }

        super();
        this.client = twilio(accountSid, authToken);
        this.fromPhoneNumber = fromPhoneNumber;
        this.recipientPhoneNumber = to.phoneNumber;
    }

    private async sendTemplate(notification: Notification<ContentCreateRequest>): Promise<void> {
        if (!notification.template) {
            throw new Error('Template is required');
        }

        try {
            const templateResult = await this.client.content.v1.contents.create(notification.template);

            console.log('Twilio WhatsApp template sent:', templateResult.sid);

            const messageResult = await this.client.messages.create({
                body: notification.body,
                from: `whatsapp:${this.fromPhoneNumber}`,
                to: `whatsapp:+${this.recipientPhoneNumber}`,
                contentSid: templateResult.sid
            });

            console.log('Twilio WhatsApp message sent:', messageResult.sid);
        } catch (error) {
            console.error('Failed to send Twilio WhatsApp template:', error);
            throw error;
        }
    }

    async sendNotification(notification: Notification): Promise<void> {
        if (notification.template) {
            await this.sendTemplate(notification as Notification<ContentCreateRequest>);
            return;
        }

        const message = this.formatMessage(notification);

        try {
            const result = await this.client.messages.create({
                body: message,
                from: `whatsapp:${this.fromPhoneNumber}`,
                to: `whatsapp:+${this.recipientPhoneNumber}`
            });

            console.log('Twilio WhatsApp message sent:', result.sid);
        } catch (error) {
            console.error('Failed to send Twilio WhatsApp notification:', error);
            throw error;
        }
    }

    private formatMessage(notification: Notification): string {
        return `*${notification.title}*\n\n${notification.body}`;
    }

    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.TWILLIO;
    }
}
