import { GAME_NAMES, GameState } from '@phone-games/games';
import { Notification, NOTIFICATION_METHODS, ValidGameActions, ValidNotificationMethods, ValidPartyActions } from '../interfaces/notification.js';
import { BaseImpostorFormatter } from './baseImpostorFormatter.js';
import { createTranslator } from '../services/i18n/translator.js';
import { ILogger } from '@phone-games/logger';
import { TemplateRegistry, FormatterMetadata, PartyParams } from '../internal.js';
import { TwilioTemplate } from '../interfaces/templates.js';

/**
 * Twilio formatter for Impostor game.
 * Extends BaseImpostorFormatter with Twilio-specific features:
 * - Interactive list pickers via Twilio Content API
 * - QR code generation for party invitations
 */
export class ImpostorTwilioFormatter extends BaseImpostorFormatter {
  private logger: ILogger;
  private publicUrl: string;
  private templateRegistry: TemplateRegistry;

  constructor(logger: ILogger, publicUrl: string, templateRegistry: TemplateRegistry) {
    super();
    this.logger = logger.child({ formatter: 'ImpostorTwilioFormatter' });
    this.publicUrl = publicUrl;
    this.templateRegistry = templateRegistry;
  }
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
   * Formats party creation notification with QR code
   *
   * Overrides the base implementation to include a QR code image URL
   * that users can scan to join the party via WhatsApp.
   *
   * @param params - Party creation parameters
   * @param translator - Translator instance for localized messages
   * @param metadata - Contains fromPhoneNumber and publicUrl for QR generation
   * @returns Notification with QR code mediaUrl
   *
   * @example
   * ```typescript
   * const notification = await formatter.formatCreateParty(
   *   { partyId: 'abc123', partyName: 'My Party', gameName: 'impostor' },
   *   translator,
   *   { fromPhoneNumber: '+14155238886', publicUrl: 'https://api.example.com' }
   * );
   * // Returns notification with mediaUrl: 'https://api.example.com/api/qr/abc123'
   * ```
   */
  protected async formatCreateParty(params: PartyParams, translator: ReturnType<typeof createTranslator>, metadata?: FormatterMetadata): Promise<Notification> {
    const notification = await super.formatCreateParty(params, translator, metadata);

    // Add QR code URL if metadata is provided
    if (metadata?.fromPhoneNumber) {
      const qrUrl = `${this.publicUrl}/api/qr/${params.partyId}`;

      this.logger.info('Adding QR code URL to notification', { qrUrl });

      return {
        ...notification,
        body: `${notification.body}\n\n${translator.t('party.qrCodeAttached')}`,
        mediaUrl: qrUrl,
      };
    }
    

    return notification;
  }

  protected async formatPlayerJoined(params: PartyParams, translator: ReturnType<typeof createTranslator>): Promise<Notification<TwilioTemplate>> {
    const template = await this.templateRegistry.getTemplate({ language: translator.getLanguage(), action: ValidPartyActions.PLAYER_JOINED, platform: 'twilio', partyParams: params }, { translator });

    const contentVariables = JSON.stringify({
      body: translator.t('party.playerJoined.body', { partyName: params.partyName }),
      list_button: translator.t('party.playerJoined.listButton'),
      start_match: translator.t('party.startMatchCommand'),
    });

    return {
      title: 'Player Joined',
      body: "",
      action: ValidPartyActions.PLAYER_JOINED,
      template: {
        sid: template.sid,
        contentVariables,
      },
    };
  }

  protected async startMatchCommand(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Promise<Notification<TwilioTemplate>> {
    const template = await this.templateRegistry.getTemplate({ language: translator.getLanguage(), action: ValidGameActions.START_MATCH, platform: 'twilio', partyParams: {
      partyId: notification.partyId,
      partyName: "",
      gameName: GAME_NAMES.IMPOSTOR,
    } }, { translator });

    const contentVariables = JSON.stringify({
      body: translator.t('commands.startMatch'),
      list_button: translator.t('party.matchStarted.listButton'),
      start_round: translator.t('commands.startRound'),
    });

    return {
      title: 'Start Match',
      body: "",
      action: ValidGameActions.START_MATCH,
      template: {
        sid: template.sid,
        contentVariables,
      },
    };
  }

  private async getOrCreateTemplate(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Promise<TwilioTemplate> {
    const template = await this.templateRegistry.getTemplate({ language: translator.getLanguage(), action: ValidGameActions.NEXT_ROUND, platform: 'twilio', partyParams: {
      partyId: notification.partyId,
      partyName: "",
      gameName: GAME_NAMES.IMPOSTOR,
    } }, { translator });

    if (!template) {
      const createdTemplate = await this.templateRegistry.createTemplate({ language: translator.getLanguage(), action: ValidGameActions.NEXT_ROUND, platform: 'twilio', partyParams: {
        partyId: notification.partyId,
        partyName: "",
        gameName: GAME_NAMES.IMPOSTOR,
      } }, { translator });

      return createdTemplate
    }

    return template;
  }


  /**
   * Formats a notification for the start of the next round in the Impostor game.
   *
   * Overrides the base implementation to add Twilio-specific template support
   * for interactive list picker functionality.
   *
   * @param notification - The game state notification containing round information
   * @param translator - Translator instance for localized messages
   * @returns A formatted notification with Twilio content template for next round
   *
   * @remarks
   * This method safely handles missing or undefined nested properties in the notification
   * object and provides fallback values to ensure a valid notification is always returned.
   * Uses translator for language-aware messages based on user's phone country code.
   */
  protected async formatNextRound(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Promise<Notification<TwilioTemplate>> {
    // Safely extract the word with null/undefined guards
    const word = notification?.customState?.currentRoundState?.word ?? 'unknown';
    
    const template = await this.getOrCreateTemplate(notification, translator);

    this.logger.info('Formatting next round with template');

    const contentVariables = JSON.stringify({ word });

    return {
      title: 'Impostor',
      body: "",
      action: ValidGameActions.NEXT_ROUND,
      template: {
        sid: template.sid,
        contentVariables,
      },
    };
  }
  

  protected async formatMiddleRoundAction(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Promise<Notification<TwilioTemplate>> {
    const template = await this.templateRegistry.getTemplate({ language: translator.getLanguage(), action: ValidGameActions.MIDDLE_ROUND_ACTION, platform: 'twilio', partyParams: {
      partyId: notification.partyId,
      partyName: "",
      gameName: GAME_NAMES.IMPOSTOR,
    } }, { translator });
    
    const contentVariables = JSON.stringify({
      body: translator.t('impostor.middleRoundAction.body'),
      list_button: translator.t('party.middleRoundAction.listButton'),
      finish_round: translator.t('commands.finishRound'),
    });

    return {
      title: 'Middle Round Action',
      body: "",
      action: ValidGameActions.MIDDLE_ROUND_ACTION,
      template: {
        sid: template.sid,
        contentVariables,
      },
    };
  }

  protected async formatFinishRound(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Promise<Notification<TwilioTemplate>> {
    const template = await this.templateRegistry.getTemplate({ language: translator.getLanguage(), action: ValidGameActions.FINISH_ROUND, platform: 'twilio', partyParams: {
      partyId: notification.partyId,
      partyName: "",
      gameName: GAME_NAMES.IMPOSTOR,
    } }, { translator });
    
    
    const contentVariables = JSON.stringify({
      body: translator.t('impostor.roundFinished', { round: notification.currentRound }),
      list_button: translator.t('party.roundFinished.listButton'),
      start_match: translator.t('commands.startMatch'),
    });

    return {
      title: 'Finish Round',
      action: ValidGameActions.FINISH_ROUND,
      body: "",
      template: {
        sid: template.sid,
        contentVariables,
      },
    };
  }

  protected async formatFinishMatch(notification: GameState<GAME_NAMES.IMPOSTOR>, translator: ReturnType<typeof createTranslator>): Promise<Notification<TwilioTemplate>> {
    const template = await this.templateRegistry.getTemplate({ language: translator.getLanguage(), action: ValidGameActions.FINISH_MATCH, platform: 'twilio', partyParams: {
      partyId: notification.partyId,
      partyName: "",
      gameName: GAME_NAMES.IMPOSTOR,
    } }, { translator });
    
    
    const contentVariables = JSON.stringify({
      body: translator.t('impostor.matchFinished.body'),
      list_button: translator.t('party.matchFinished.listButton'),
      create_party: translator.t('commands.help'),
    });

    return {
      title: 'Finish Match',
      body: "",
      action: ValidGameActions.FINISH_MATCH,
      template: {
        sid: template.sid,
        contentVariables,
      },
    };
  }
}
