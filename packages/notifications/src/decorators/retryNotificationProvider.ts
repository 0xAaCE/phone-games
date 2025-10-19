import { Notification, ValidNotificationMethods } from '../interfaces/notification.js';
import { NotificationProvider } from '../interfaces/notificationProvider.js';
import { ILogger } from '@phone-games/logger';

/**
 * Configuration for retry behavior.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial delay in milliseconds before first retry (default: 1000ms) */
  delayMs: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
}

/**
 * Decorator Pattern - Adds retry logic to any NotificationProvider.
 *
 * Features:
 * - Automatic retry on failure
 * - Exponential backoff (1s → 2s → 4s → 8s...)
 * - Logging of retry attempts
 * - Preserves original provider behavior
 *
 * Example:
 * ```typescript
 * const whatsapp = new WhatsappNotificationProvider(...);
 * const reliable = new RetryNotificationProvider(whatsapp, {
 *   maxRetries: 3,
 *   delayMs: 1000,
 *   backoffMultiplier: 2
 * });
 * ```
 */
export class RetryNotificationProvider extends NotificationProvider {
  private readonly config: Required<RetryConfig>;

  constructor(
    private wrapped: NotificationProvider,
    config: Partial<RetryConfig> = {},
    private logger?: ILogger
  ) {
    super();
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      delayMs: config.delayMs ?? 1000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
    };
  }

  async sendNotification(notification: Notification): Promise<void> {
    let lastError: Error | undefined;
    let delay = this.config.delayMs;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.wrapped.sendNotification(notification);

        // Success! Log if this was a retry
        if (attempt > 0 && this.logger) {
          this.logger.info('Notification sent after retry', {
            attempt,
            action: notification.action,
          });
        }

        return; // Success
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.maxRetries) {
          // Log retry attempt
          if (this.logger) {
            this.logger.warn('Notification failed, retrying', {
              attempt: attempt + 1,
              maxRetries: this.config.maxRetries,
              delayMs: delay,
              action: notification.action,
              error: lastError.message,
            });
          }

          // Wait before retry with exponential backoff
          await this.sleep(delay);
          delay *= this.config.backoffMultiplier;
        }
      }
    }

    // All retries exhausted
    if (this.logger) {
      this.logger.error('Notification failed after all retries', lastError!, {
        maxRetries: this.config.maxRetries,
        action: notification.action,
      });
    }

    throw lastError;
  }

  getNotificationMethod(): ValidNotificationMethods {
    return this.wrapped.getNotificationMethod();
  }

  /**
   * Sleep for specified milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
