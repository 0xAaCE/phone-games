import { vi } from 'vitest';
import { NotificationProvider } from '../../interfaces/NotificationProvider.js';
import { Parser } from '../../interfaces/Parser.js';
import { ValidGameNames, GAME_NAMES } from '@phone-games/games';
import { ValidNotificationMethods, Notification } from '../../interfaces/Notification.js';

export class MockNotificationProvider {
  static create(method: ValidNotificationMethods = 'whatsapp'): NotificationProvider {
    return {
      sendNotification: vi.fn().mockResolvedValue(undefined),
      getNotificationMethod: vi.fn().mockReturnValue(method),
    } as unknown as NotificationProvider;
  }
}

export class MockParser {
  static create(
    gameName: ValidGameNames = GAME_NAMES.IMPOSTOR,
    method: ValidNotificationMethods = 'whatsapp'
  ): Parser {
    return {
      getGameName: vi.fn().mockReturnValue(gameName),
      getNotificationMethod: vi.fn().mockReturnValue(method),
      parse: vi.fn().mockResolvedValue({
        title: 'Test Title',
        body: 'Test Body',
        action: 'START_MATCH',
        data: {},
      } as Notification),
    } as unknown as Parser;
  }
}
