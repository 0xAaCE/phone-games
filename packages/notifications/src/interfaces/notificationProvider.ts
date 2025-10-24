import { Notification, ValidNotificationMethods } from "./notification.js";


export abstract class NotificationProvider {
    abstract sendNotification(notification: Notification): Promise<void>;
    abstract getNotificationMethod(): ValidNotificationMethods;

    /**
     * Gets the recipient's phone number (if available)
     * Used for language detection based on phone country code
     *
     * @returns Phone number in international format or null if not available
     */
    abstract getPhoneNumber(): string | null;

    /**
     * Gets source phone number (if available)
     *
     * @returns Source phone number in international format or null if not available
     */
    abstract getFromPhoneNumber(): string | null;
}