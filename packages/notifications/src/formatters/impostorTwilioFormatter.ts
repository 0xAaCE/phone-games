import { ContentCreateRequest } from 'twilio/lib/rest/content/v1/content.js';

import { GAME_NAMES, GameState } from '@phone-games/games';
import { Notification, NOTIFICATION_METHODS, ValidGameActions, ValidNotificationMethods } from '../interfaces/notification.js';
import { BaseImpostorFormatter } from './baseImpostorFormatter.js';

/**
 * Twilio formatter for Impostor game.
 * Inherits all formatting logic from BaseImpostorFormatter.
 * Only specifies the notification delivery method.
 */
export class ImpostorTwilioFormatter extends BaseImpostorFormatter {
  getNotificationMethod(): ValidNotificationMethods {
    return NOTIFICATION_METHODS.TWILIO;
  }

  protected formatNextRound(notification: GameState<GAME_NAMES.IMPOSTOR>): Notification<ContentCreateRequest> {
    const template: ContentCreateRequest = {
      friendlyName: 'test',
      language: 'es',
      types: {
        twilioListPicker: {
          body: 'Es hora de elegir un impostor',
          button: 'Lista de jugadores',
          items: [
            {
              id: '1',
              item: 'test',
              description: 'test',
            }
          ]
        }
      }
    }

    return {
      title: 'Impostor',
      body: 'The next round has started and your word is: \n\n' + notification.customState.currentRoundState.word,
      action: ValidGameActions.NEXT_ROUND,
      data: notification,
      template
    };
  }
}
