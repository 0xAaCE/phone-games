import { User } from "@phone-games/db";
import { ILogger } from "@phone-games/logger";
import { Notification, NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/notification.js";
import { NotificationProvider } from "../interfaces/notificationProvider.js";
import twilio from 'twilio';
import { ContentCreateRequest } from "twilio/lib/rest/content/v1/content.js";

export class TwilioWhatsAppNotificationProvider extends NotificationProvider {
    private client: twilio.Twilio;
    private fromPhoneNumber: string;
    private recipientPhoneNumber: string;
    private logger: ILogger;

    constructor(accountSid: string, authToken: string, fromPhoneNumber: string, to: User, logger: ILogger) {
        if (!to.phoneNumber) {
            throw new Error('User does not have a phone number');
        }

        super();
        this.client = twilio(accountSid, authToken);
        this.fromPhoneNumber = fromPhoneNumber;
        this.recipientPhoneNumber = to.phoneNumber;
        this.logger = logger.child({ provider: 'TwilioWhatsAppNotificationProvider', recipient: to.phoneNumber });
    }

    private async sendTemplate(notification: Notification<ContentCreateRequest>): Promise<void> {
        if (!notification.template) {
            throw new Error('Template is required');
        }

        try {
            const templateResult = await this.client.content.v1.contents.create(notification.template);

            this.logger.info('Twilio WhatsApp template sent', { templateSid: templateResult.sid });

            const messageResult = await this.client.messages.create({
                body: notification.body,
                from: `whatsapp:${this.fromPhoneNumber}`,
                to: `whatsapp:+${this.recipientPhoneNumber}`,
                contentSid: templateResult.sid
            });

            this.logger.info('Twilio WhatsApp message sent', { messageSid: messageResult.sid });
        } catch (error) {
            this.logger.error('Failed to send Twilio WhatsApp template', error instanceof Error ? error : new Error(String(error)));
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

            this.logger.info('Twilio WhatsApp message sent', { messageSid: result.sid });
        } catch (error) {
            this.logger.error('Failed to send Twilio WhatsApp notification', error instanceof Error ? error : new Error(String(error)));
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
