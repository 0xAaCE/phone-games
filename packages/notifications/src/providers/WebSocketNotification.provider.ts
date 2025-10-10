import { WebSocket } from "ws";

import { Notification, NOTIFICATION_METHODS, ValidNotificationMethods } from "../interfaces/Notification.js";
import { NotificationProvider } from "../interfaces/NotificationProvider.js";

export class WebSocketNotificationProvider extends NotificationProvider {
    private connection: WebSocket;

    constructor(ws: WebSocket) {
        super();
        this.connection = ws;
    }

    async sendNotification(notification: Notification): Promise<void> {
        const message = JSON.stringify({
            type: 'notification',
            payload: notification,
        });

        if (this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(message);
        }

        console.log(`WebSocket notification sent to ${this.connection.url}`);
    }

    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.WEB_SOCKET;
    }
}
