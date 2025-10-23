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
  /**
   * Gets the notification delivery method for this formatter.
   * 
   * @returns The notification method, specifically NOTIFICATION_METHODS.TWILIO
   * @public
   */
  getNotificationMethod(): ValidNotificationMethods {
    return NOTIFICATION_METHODS.TWILIO;
  }

  /**
   * Formats a notification for the start of the next round in the Impostor game.
   * 
   * @param notification - The game state notification containing round information
   * @returns A formatted notification with Twilio content template for next round
   * 
   * @remarks
   * This method safely handles missing or undefined nested properties in the notification
   * object and provides fallback values to ensure a valid notification is always returned.
   */
  protected formatNextRound(notification: GameState<GAME_NAMES.IMPOSTOR>): Notification<ContentCreateRequest> {
    // Safely extract the word with null/undefined guards
    const word = notification?.customState?.currentRoundState?.word ?? 'unknown';
    
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
      body: 'The next round has started and your word is: \n\n' + word,
      action: ValidGameActions.NEXT_ROUND,
      data: notification,
      template
    };
  }
}
