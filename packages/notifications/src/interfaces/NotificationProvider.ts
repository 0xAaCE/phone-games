import { Notification, ValidNotificationMethods } from "./Notification";


export abstract class NotificationProvider {
    abstract sendNotification(notification: Notification): Promise<void>;
    abstract getNotificationMethod(): ValidNotificationMethods;
}