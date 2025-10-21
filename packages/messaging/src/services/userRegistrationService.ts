import { User } from "@phone-games/db";
import { NotificationProvider, NotificationService, WhatsappNotificationProvider, TwilioWhatsAppNotificationProvider } from "@phone-games/notifications";
import { UserService } from "@phone-games/user";
import { ILogger } from "@phone-games/logger";
import { ExternalServiceError, MessageParsingError } from "@phone-games/errors";
import { MessagePlatform } from "../interfaces/parsers/index.js";

/**
 * Service responsible for user registration and notification provider setup
 *
 * Handles the infrastructure concern of ensuring users exist and have
 * notification providers registered for their messaging platform.
 *
 * This is separate from MessageHandler to:
 * - Keep MessageHandler focused on message orchestration
 * - Make user registration logic reusable across different handlers
 * - Separate infrastructure concerns from domain logic
 */
export class UserRegistrationService {
  private logger: ILogger;

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    logger: ILogger
  ) {
    this.logger = logger.child({ service: 'UserRegistrationService' });
  }

  /**
   * Ensure a user exists and has a notification provider registered
   *
   * This is idempotent - safe to call multiple times for the same user.
   *
   * @param platform - The messaging platform (WhatsApp, Twilio, etc.)
   * @param userInfo - User information extracted from the message
   * @returns The user entity (created or existing)
   *
   * @example
   * await userRegistrationService.ensureUserRegistered(
   *   MessagePlatform.WHATSAPP,
   *   { id: "123", username: "Alice", phoneNumber: "+1234567890" }
   * );
   */
  async ensureUserRegistered(
    platform: MessagePlatform,
    userInfo: { id: string; username: string; phoneNumber: string }
  ): Promise<User> {
    this.logger.debug('Ensuring user is registered', { userId: userInfo.id, platform });

    // 1. Create user if doesn't exist
    let user = await this.userService.getUserById(userInfo.id);
    if (!user) {
      this.logger.info('Creating new user', { userId: userInfo.id });
      user = await this.userService.createUser(userInfo);
    }

    // 2. Register notification provider if not already registered
    if (this.notificationService.hasUser(userInfo.id)) {
      this.logger.debug('User already has notification provider', { userId: userInfo.id });
      return user;
    }

    this.logger.info('Registering notification provider', { userId: userInfo.id, platform });
    const provider = this.createNotificationProvider(platform, user);
    await this.notificationService.registerUser(userInfo.id, provider);

    return user;
  }

  /**
   * Create a notification provider for the given platform
   *
   * @param platform - The messaging platform
   * @param user - The user entity
   * @returns A notification provider instance
   * @throws {ExternalServiceError} If required environment variables are missing
   * @throws {MessageParsingError} If the platform is not supported
   *
   * @private
   */
  private createNotificationProvider(platform: MessagePlatform, user: User): NotificationProvider {
    switch (platform) {
      case MessagePlatform.WHATSAPP: {
        const apiUrl = process.env.WHATSAPP_API_URL;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const apiToken = process.env.WHATSAPP_API_TOKEN;

        if (!apiUrl || !phoneNumberId || !apiToken) {
          throw new ExternalServiceError('Missing required WhatsApp environment variables');
        }

        return new WhatsappNotificationProvider(apiUrl, phoneNumberId, apiToken, user);
      }

      case MessagePlatform.TWILIO: {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

        if (!accountSid || !authToken || !whatsappFrom) {
          throw new ExternalServiceError('Missing required Twilio environment variables');
        }

        return new TwilioWhatsAppNotificationProvider(accountSid, authToken, whatsappFrom, user);
      }

      default:
        throw new MessageParsingError(`Message platform not supported: ${platform}`);
    }
  }
}
