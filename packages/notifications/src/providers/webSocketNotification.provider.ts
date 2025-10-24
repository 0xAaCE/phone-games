import { WebSocket } from "ws";

import { ILogger } from "@phone-games/logger";
import { Notification, NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/notification.js";
import { NotificationProvider } from "../interfaces/notificationProvider.js";

export class WebSocketNotificationProvider extends NotificationProvider {
    private connection: WebSocket;
    private logger: ILogger;

    constructor(ws: WebSocket, logger: ILogger) {
        super();
        this.connection = ws;
        this.logger = logger.child({ provider: 'WebSocketNotificationProvider', url: ws.url });
    }

    async sendNotification(notification: Notification): Promise<void> {
        const message = JSON.stringify({
            type: 'notification',
            payload: notification,
        });

        if (this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(message);
            this.logger.debug('WebSocket notification sent', { url: this.connection.url, action: notification.action });
        } else {
            this.logger.warn('WebSocket not open, notification not sent', {
                url: this.connection.url,
                readyState: this.connection.readyState
            });
        }
    }

    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.WEB_SOCKET;
    }

    getPhoneNumber(): string | null {
        // WebSocket connections don't have phone numbers
        // Will default to English in formatters
        return null;
    }

    getFromPhoneNumber(): string | null {
        // WebSocket connections don't have phone numbers
        // Will default to English in formatters
        return null;
    }
}
