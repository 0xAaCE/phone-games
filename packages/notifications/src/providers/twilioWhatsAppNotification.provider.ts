import { User } from "@phone-games/db";
import { ILogger } from "@phone-games/logger";
import { Notification, NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/notification.js";
import { NotificationProvider } from "../interfaces/notificationProvider.js";
import twilio from 'twilio';
import { ContentCreateRequest } from "twilio/lib/rest/content/v1/content.js";

/**
 * Twilio WhatsApp notification provider
 *
 * Sends notifications via Twilio's WhatsApp Business API. Supports both
 * simple text messages and rich template-based messages with interactive
 * content.
 *
 * @example
 * ```typescript
 * const provider = new TwilioWhatsAppNotificationProvider(
 *   'ACCOUNT_SID',
 *   'AUTH_TOKEN',
 *   'whatsapp:+1234567890',
 *   user,
 *   logger
 * );
 *
 * await provider.sendNotification({
 *   title: 'Game Started',
 *   body: 'Your turn has begun',
 *   action: ValidGameActions.START_MATCH,
 *   data: gameState
 * });
 * ```
 */
export class TwilioWhatsAppNotificationProvider extends NotificationProvider {
    /** Twilio client instance for API communication */
    private client: twilio.Twilio;

    /** WhatsApp-enabled Twilio phone number to send from */
    private fromPhoneNumber: string;

    /** Recipient's WhatsApp phone number */
    private recipientPhoneNumber: string;

    /** Logger instance with provider context */
    private logger: ILogger;

    /**
     * Creates a new Twilio WhatsApp notification provider
     *
     * @param accountSid - Twilio account SID
     * @param authToken - Twilio authentication token
     * @param fromPhoneNumber - WhatsApp-enabled Twilio phone number (format: whatsapp:+1234567890)
     * @param to - User to send notifications to (must have phoneNumber)
     * @param logger - Logger instance for structured logging
     *
     * @throws {Error} If user does not have a phone number
     *
     * @example
     * ```typescript
     * const provider = new TwilioWhatsAppNotificationProvider(
     *   process.env.TWILIO_ACCOUNT_SID,
     *   process.env.TWILIO_AUTH_TOKEN,
     *   'whatsapp:+1234567890',
     *   user,
     *   logger
     * );
     * ```
     */
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

    /**
     * Sends a rich template-based WhatsApp message
     *
     * Uses Twilio's Content API to create and send interactive messages with
     * buttons, lists, or other rich media. The template is created on-the-fly
     * and then sent to the recipient.
     *
     * @param notification - Notification with template data
     * @throws {Error} If template is missing or Twilio API call fails
     * @private
     *
     * @example
     * ```typescript
     * await this.sendTemplate({
     *   title: 'Vote Now',
     *   body: 'Select a player',
     *   action: ValidGameActions.NEXT_ROUND,
     *   data: gameState,
     *   template: {
     *     friendlyName: 'vote-picker',
     *     language: 'en',
     *     types: {
     *       twilioListPicker: {
     *         body: 'Select a player to vote',
     *         button: 'Vote',
     *         items: [...]
     *       }
     *     }
     *   }
     * });
     * ```
     */
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

    /**
     * Sends a notification via Twilio WhatsApp
     *
     * Automatically determines whether to send a simple text message or a
     * rich template-based message based on the presence of template data.
     * Supports media attachments (images, QR codes) via mediaUrl.
     *
     * @param notification - The notification to send
     * @throws {Error} If Twilio API call fails
     *
     * @example
     * ```typescript
     * // Simple text notification
     * await provider.sendNotification({
     *   title: 'Round Started',
     *   body: 'Your word is: apple',
     *   action: ValidGameActions.NEXT_ROUND,
     *   data: gameState
     * });
     *
     * // Template-based notification
     * await provider.sendNotification({
     *   title: 'Vote',
     *   body: 'Select a player',
     *   action: ValidGameActions.MIDDLE_ROUND_ACTION,
     *   data: gameState,
     *   template: contentCreateRequest
     * });
     *
     * // Notification with media attachment (QR code)
     * await provider.sendNotification({
     *   title: 'Party Created',
     *   body: 'Scan QR to share',
     *   action: ValidPartyActions.CREATE_PARTY,
     *   mediaUrl: 'https://api.example.com/qr/party123'
     * });
     * ```
     */
    async sendNotification(notification: Notification): Promise<void> {
        if (notification.template) {
            await this.sendTemplate(notification as Notification<ContentCreateRequest>);
            return;
        }

        const message = this.formatMessage(notification);

        try {
            const messageOptions: {
                body: string;
                from: string;
                to: string;
                mediaUrl?: string[];
            } = {
                body: message,
                from: `whatsapp:${this.fromPhoneNumber}`,
                to: `whatsapp:+${this.recipientPhoneNumber}`
            };

            // Add media URL if present (for QR codes, images, etc.)
            if (notification.mediaUrl) {
                messageOptions.mediaUrl = [notification.mediaUrl];
            }

            const result = await this.client.messages.create(messageOptions);

            this.logger.info('Twilio WhatsApp message sent', {
                messageSid: result.sid,
                hasMedia: !!notification.mediaUrl
            });
        } catch (error) {
            this.logger.error('Failed to send Twilio WhatsApp notification', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Formats notification into WhatsApp-styled message
     *
     * Applies WhatsApp markdown formatting to create a visually
     * appealing message with bold title.
     *
     * @param notification - The notification to format
     * @returns Formatted message string with WhatsApp markdown
     * @private
     *
     * @example
     * ```typescript
     * formatMessage({
     *   title: 'Game Started',
     *   body: 'Your turn!',
     *   action: ValidGameActions.START_MATCH,
     *   data: gameState
     * })
     * // Returns: "*Game Started*\n\nYour turn!"
     * ```
     */
    private formatMessage(notification: Notification): string {
        return `*${notification.title}*\n\n${notification.body}`;
    }

    /**
     * Returns the notification method identifier
     *
     * Used by the NotificationManager to match this provider with the
     * appropriate formatter.
     *
     * @returns "twilio" - The Twilio notification method identifier
     */
    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.TWILIO;
    }

    /**
     * Gets the recipient's phone number for language detection
     *
     * @returns The recipient's phone number in international format
     */
    getPhoneNumber(): string | null {
        return this.recipientPhoneNumber;
    }

    /**
     * Gets the Twilio "from" phone number for QR code generation
     *
     * This is the bot's WhatsApp number that users will send messages to.
     * Used by formatters to generate QR codes with WhatsApp links.
     *
     * @returns The Twilio WhatsApp phone number
     *
     * @example
     * ```typescript
     * const botNumber = provider.getFromPhoneNumber();
     * // "+14155238886"
     * ```
     */
    getFromPhoneNumber(): string {
        return this.fromPhoneNumber;
    }
}
