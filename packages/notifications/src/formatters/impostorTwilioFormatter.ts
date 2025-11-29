import { GAME_NAMES, GameState } from '@phone-games/games';
import { Notification, NOTIFICATION_METHODS, ValidGameActions, ValidNotificationMethods } from '../interfaces/notification.js';
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
    
    const template = await this.templateRegistry.getTemplate({ language: translator.getLanguage(), action: ValidGameActions.NEXT_ROUND, platform: 'twilio', gameState: notification }, { translator });

    this.logger.info('Formatting next round with template');

    const contentVariables = JSON.stringify({ word });

    return {
      title: 'Impostor',
      body: "",
      action: ValidGameActions.NEXT_ROUND,
      data: notification,
      template: {
        sid: template.sid,
        contentVariables,
      },
    };
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
}
