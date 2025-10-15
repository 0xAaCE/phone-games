import { Notification, ValidNotificationMethods } from "./notification.js";


export abstract class NotificationProvider {
    abstract sendNotification(notification: Notification): Promise<void>;
    abstract getNotificationMethod(): ValidNotificationMethods;
}