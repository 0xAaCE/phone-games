import { GAME_NAMES, GameState, ValidGameNames } from '@phone-games/games';
import { Formatter, PartyParams } from '../interfaces/formatter.js';
import {
  Notification,
  ValidActions,
  ValidGameActions,
  ValidPartyActions,
  ErrorParams,
} from '../interfaces/notification.js';

/**
 * Base formatter for Impostor game notifications.
 * Uses Template Method Pattern - defines the parsing algorithm and formatting logic.
 * Subclasses only need to override getNotificationMethod() to specify their delivery method.
 */
export abstract class BaseImpostorFormatter extends Formatter {
  async format<T extends ValidActions>(
    action: T,
    notification: T extends ValidGameActions ? GameState<GAME_NAMES.IMPOSTOR> : PartyParams | ErrorParams
  ): Promise<Notification> {
    switch (action) {
      case ValidGameActions.START_MATCH:
        return this.formatStartMatch(notification as GameState<GAME_NAMES.IMPOSTOR>);
      case ValidGameActions.NEXT_ROUND:
        return this.formatNextRound(notification as GameState<GAME_NAMES.IMPOSTOR>);
      case ValidGameActions.MIDDLE_ROUND_ACTION:
        return this.formatMiddleRoundAction(notification as GameState<GAME_NAMES.IMPOSTOR>);
      case ValidGameActions.FINISH_ROUND:
        return this.formatFinishRound(notification as GameState<GAME_NAMES.IMPOSTOR>);
      case ValidGameActions.FINISH_MATCH:
        return this.formatFinishMatch(notification as GameState<GAME_NAMES.IMPOSTOR>);
      case ValidPartyActions.PLAYER_JOINED:
        return this.formatPlayerJoined(notification as PartyParams);
      case ValidPartyActions.PLAYER_LEFT:
        return this.formatPlayerLeft(notification as PartyParams);
      case ValidPartyActions.CREATE_PARTY:
        return this.formatCreateParty(notification as PartyParams);
      case ValidPartyActions.ERROR:
        return this.formatError(notification as ErrorParams);
      default:
        throw new Error('Invalid action');
    }
  }

  getGameName(): ValidGameNames {
    return GAME_NAMES.IMPOSTOR;
  }

  // Game action formatters
  private formatStartMatch(notification: GameState<GAME_NAMES.IMPOSTOR>): Notification {
    return {
      title: 'Impostor',
      body:
        'The game has started and players are: \n\n' +
        notification.players.map((player) => player.user.username).join('\n'),
      action: ValidGameActions.START_MATCH,
      data: notification,
    };
  }

  private formatNextRound(notification: GameState<GAME_NAMES.IMPOSTOR>): Notification {
    return {
      title: 'Impostor',
      body: 'The next round has started and your word is: \n\n' + notification.customState.currentRoundState.word,
      action: ValidGameActions.NEXT_ROUND,
      data: notification,
    };
  }

  private formatMiddleRoundAction(notification: GameState<GAME_NAMES.IMPOSTOR>): Notification {
    return {
      title: 'Impostor',
      body: 'Your vote has been counted',
      action: ValidGameActions.MIDDLE_ROUND_ACTION,
      data: notification,
    };
  }

  private formatFinishRound(notification: GameState<GAME_NAMES.IMPOSTOR>): Notification {
    return {
      title: 'Impostor',
      body:
        'The round has finished and the impostor has ' +
        (notification.customState.currentRoundState.impostorWins ? 'won' : 'lost'),
      action: ValidGameActions.FINISH_ROUND,
      data: notification,
    };
  }

  private formatFinishMatch(notification: GameState<GAME_NAMES.IMPOSTOR>): Notification {
    return {
      title: 'Impostor',
      body: 'The match has finished',
      action: ValidGameActions.FINISH_MATCH,
      data: notification,
    };
  }

  /**
   * Override formatError to provide game-specific error formatting
   * Converts technical errors to user-friendly messages
   */
  protected formatError(params: ErrorParams): Notification {
    // Use the base formatter's implementation
    return super.formatError(params);
  }
}
