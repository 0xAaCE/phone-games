import { Notification } from '../../interfaces/Notification.js';
import { ValidGameActions, ValidPartyActions } from '../../interfaces/Notification.js';

export class NotificationTestFactory {
  static createNotification(overrides?: Partial<Notification>): Notification {
    return {
      title: 'Test Notification',
      body: 'This is a test notification',
      action: ValidGameActions.START_MATCH,
      data: {
        partyName: 'Test Party',
        partyId: 'test-party-id',
        gameName: 'impostor',
      },
      ...overrides,
    };
  }

  static createGameNotification(action: ValidGameActions): Notification {
    return this.createNotification({
      action,
      title: `Game ${action}`,
      body: `Game action: ${action}`,
    });
  }

  static createPartyNotification(action: ValidPartyActions): Notification {
    return this.createNotification({
      action,
      title: `Party ${action}`,
      body: `Party action: ${action}`,
    });
  }
}
