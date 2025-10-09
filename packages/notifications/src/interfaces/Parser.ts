import { ValidGameNames } from "@phone-games/games";
import { Notification, NotificationDataType, ValidNotificationMethods } from "./Notification";

export abstract class Parser {
    abstract parse(notification: NotificationDataType): Promise<Notification>;
    abstract getGameName(): ValidGameNames;
    abstract getNotificationMethod(): ValidNotificationMethods;
}