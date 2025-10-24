import { GAME_NAMES, GameState, ValidGameNames } from '@phone-games/games';
import { Formatter, PartyParams, FormatterMetadata } from '../interfaces/formatter.js';
import {
  Notification,
  ValidActions,
  ValidGameActions,
  ValidPartyActions,
  ErrorParams,
} from '../interfaces/notification.js';
import { detectLanguageFromPhone } from '../services/i18n/languageDetector.js';
import { createTranslator } from '../services/i18n/translator.js';

/**
 * Base formatter for Impostor game notifications.
 * Uses Template Method Pattern - defines the parsing algorithm and formatting logic.
 * Supports internationalization based on user's phone number country code.
 * Subclasses only need to override getNotificationMethod() to specify their delivery method.
 */
export abstract class BaseImpostorFormatter extends Formatter {
  async format<T extends ValidActions>(
    action: T,
    notification: T extends ValidGameActions ? GameState<GAME_NAMES.IMPOSTOR> : PartyParams | ErrorParams,
    phoneNumber?: string | null,
    metadata?: FormatterMetadata
  ): Promise<Notification> {
    // Detect language from phone number (defaults to 'en' if no phone number)
    const language = detectLanguageFromPhone(phoneNumber);
    const translator = createTranslator(language);

    // Pass translator and metadata to format methods
    switch (action) {
      case ValidGameActions.START_MATCH:
        return this.formatStartMatch(notification as GameState<GAME_NAMES.IMPOSTOR>, translator);
      case ValidGameActions.NEXT_ROUND:
        return this.formatNextRound(notification as GameState<GAME_NAMES.IMPOSTOR>, translator);
      case ValidGameActions.MIDDLE_ROUND_ACTION:
        return this.formatMiddleRoundAction(notification as GameState<GAME_NAMES.IMPOSTOR>, translator);
      case ValidGameActions.FINISH_ROUND:
        return this.formatFinishRound(notification as GameState<GAME_NAMES.IMPOSTOR>, translator);
      case ValidGameActions.FINISH_MATCH:
        return this.formatFinishMatch(notification as GameState<GAME_NAMES.IMPOSTOR>, translator);
      case ValidPartyActions.PLAYER_JOINED:
        return this.formatPlayerJoined(notification as PartyParams, translator);
      case ValidPartyActions.PLAYER_LEFT:
        return this.formatPlayerLeft(notification as PartyParams, translator);
      case ValidPartyActions.CREATE_PARTY:
        return this.formatCreateParty(notification as PartyParams, translator, metadata);
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
  protected formatStartMatch(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Notification {
    return {
      title: 'Impostor',
      body: translator.t('impostor.matchStarted'),
      action: ValidGameActions.START_MATCH,
      data: notification,
    };
  }

  protected formatNextRound(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Notification {
    const word = notification?.customState?.currentRoundState?.word ?? 'unknown';

    return {
      title: 'Impostor',
      body: translator.t('impostor.nextRound', { word }),
      action: ValidGameActions.NEXT_ROUND,
      data: notification,
    };
  }

  protected formatMiddleRoundAction(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Notification {
    return {
      title: 'Impostor',
      body: translator.t('impostor.voteReceived'),
      action: ValidGameActions.MIDDLE_ROUND_ACTION,
      data: notification,
    };
  }

  protected formatFinishRound(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Notification {
    const round = notification.currentRound || 1;

    return {
      title: 'Impostor',
      body: translator.t('impostor.roundFinished', { round }),
      action: ValidGameActions.FINISH_ROUND,
      data: notification,
    };
  }

  protected formatFinishMatch(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Notification {
    return {
      title: 'Impostor',
      body: translator.t('impostor.matchFinished'),
      action: ValidGameActions.FINISH_MATCH,
      data: notification,
    };
  }

  // Party action formatters
  protected formatCreateParty(params: PartyParams, translator: ReturnType<typeof createTranslator>, _metadata?: FormatterMetadata): Notification {
    return {
      title: 'Party Created',
      body: translator.t('party.created', {
        partyName: params.partyName,
        partyId: params.partyId,
      }),
      action: ValidPartyActions.CREATE_PARTY,
    };
  }

  protected formatPlayerJoined(params: PartyParams, translator: ReturnType<typeof createTranslator>): Notification {
    return {
      title: 'Player Joined',
      body: translator.t('party.playerJoined', {
        partyName: params.partyName,
      }),
      action: ValidPartyActions.PLAYER_JOINED,
    };
  }

  protected formatPlayerLeft(params: PartyParams, translator: ReturnType<typeof createTranslator>): Notification {
    return {
      title: 'Player Left',
      body: translator.t('party.playerLeft', {
        partyName: params.partyName,
      }),
      action: ValidPartyActions.PLAYER_LEFT,
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
