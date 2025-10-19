import { NOTIFICATION_METHODS, ValidNotificationMethods } from '../interfaces/notification.js';
import { BaseImpostorFormatter } from './baseImpostorFormatter.js';

/**
 * WebSocket formatter for Impostor game.
 * Inherits all formatting logic from BaseImpostorFormatter.
 * Only specifies the notification delivery method.
 */
export class ImpostorWebSocketFormatter extends BaseImpostorFormatter {
  getNotificationMethod(): ValidNotificationMethods {
    return NOTIFICATION_METHODS.WEB_SOCKET;
  }
}
