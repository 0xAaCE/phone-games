import { GameState, ValidGameNames } from "@phone-games/games";
import { NotificationError } from "@phone-games/errors";
import { ILogger } from "@phone-games/logger";
import {
    NotificationService,
    NotificationProvider,
    Formatter,
    PartyParams,
    ValidActions,
    ValidGameActions,
    ValidNotificationMethods,
    ValidPartyActions,
    ErrorParams
} from "../internal.js";

/**
 * Composite key for looking up formatters by game and notification method
 * Format: "gameName-notificationMethod" (e.g., "impostor-whatsapp")
 */
type FormatterKey = `${ValidGameNames}-${ValidNotificationMethods}`;

/**
 * Central manager for game notifications
 * Implements the NotificationService interface to send notifications to users
 *
 * Uses Template Method Pattern to define a common notification algorithm
 * that all notification methods delegate to. Handles provider registration,
 * formatter selection, and notification delivery with error handling.
 *
 * @example
 * const manager = new NotificationManager(formatters, logger);
 * await manager.registerUser(userId, whatsappProvider);
 * await manager.notifyStartMatch("impostor", userId, gameState);
 */
export class NotificationManager implements NotificationService {
    /**
     * Maps user IDs to their notification providers (WhatsApp, WebSocket, etc.)
     */
    private notificationProviders: Map<string, NotificationProvider> = new Map();

    /**
     * Maps formatter keys (game-method) to formatter instances
     */
    private formatters: Map<FormatterKey, Formatter> = new Map();

    /**
     * Logger instance for debugging and error tracking
     */
    private logger: ILogger;

    /**
     * Creates a new NotificationManager instance
     * Initializes formatters and sets up logging
     *
     * @param formatters - Array of formatter instances for different games/methods
     * @param logger - Logger instance for tracking notifications
     *
     * @example
     * const manager = new NotificationManager(
     *   [whatsappImpostorFormatter, websocketImpostorFormatter],
     *   logger
     * );
     */
    constructor(formatters: Formatter[], logger: ILogger) {
        formatters.forEach(formatter => {
            this.formatters.set(this.getFormatterKey(formatter), formatter);
        });
        this.logger = logger.child({ service: 'NotificationManager' });
    }

    /**
     * Check if a user is registered for notifications
     *
     * @param userId - The user ID to check
     * @returns true if the user has a registered notification provider
     *
     * @example
     * if (manager.hasUser("user123")) {
     *   await manager.notifyStartMatch("impostor", "user123", gameState);
     * }
     */
    hasUser(userId: string): boolean {
        return this.notificationProviders.has(userId);
    }

    /**
     * Generate a formatter key from a formatter instance
     *
     * @param formatter - The formatter to generate a key for
     * @returns A composite key in the format "gameName-notificationMethod"
     *
     * @private
     */
    private getFormatterKey(formatter: Formatter): FormatterKey {
        return `${formatter.getGameName()}-${formatter.getNotificationMethod()}`;
    }

    /**
     * Get the notification provider and formatter for a user and game
     *
     * @param userId - The user ID to get provider/formatter for
     * @param gameName - The game name to get formatter for
     * @returns Object containing the provider and formatter
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @private
     */
    private getProviderAndFormatter(userId: string, gameName: ValidGameNames): { provider: NotificationProvider, formatter: Formatter } {
        const provider = this.notificationProviders.get(userId);
        if (!provider) {
            throw new NotificationError(`Notification provider not found for user ${userId}`);
        }
        const formatter = this.formatters.get(`${gameName}-${provider.getNotificationMethod()}`);
        if (!formatter) {
            throw new NotificationError("Formatter not found");
        }
        return { provider, formatter };
    }

    /**
     * Register a user for notifications with a specific provider
     *
     * @param userId - The user ID to register
     * @param notificationMethod - The notification provider instance (WhatsApp, WebSocket, etc.)
     *
     * @example
     * const provider = new WhatsappNotificationProvider(apiUrl, phoneId, token, user);
     * await manager.registerUser("user123", provider);
     */
    async registerUser(userId: string, notificationMethod: NotificationProvider): Promise<void> {
        this.notificationProviders.set(userId, notificationMethod);
    }

    /**
     * Unregister a user from notifications
     * Removes the user's notification provider
     *
     * @param userId - The user ID to unregister
     *
     * @example
     * await manager.unregisterUser("user123");
     */
    async unregisterUser(userId: string): Promise<void> {
        this.notificationProviders.delete(userId);
    }

    /**
     * Template Method Pattern - defines the notification algorithm.
     * All notification methods delegate to this common implementation.
     *
     * Algorithm:
     * 1. Get provider and formatter for user/game (throws on validation errors)
     * 2. Format notification content
     * 3. Send notification via provider (logs but doesn't throw on send errors)
     *
     * Note: Validation errors (no provider, no formatter) are thrown.
     * Network/send errors are logged but swallowed to prevent crashes.
     */
    private async notify<T extends ValidActions>(
        userId: string,
        gameName: ValidGameNames,
        action: T,
        data: T extends ValidGameActions ? GameState<ValidGameNames> : (PartyParams | ErrorParams)
    ): Promise<void> {
        // Validation - throw if provider/formatter not found
        const { provider, formatter } = this.getProviderAndFormatter(userId, gameName);
        const notification = await formatter.format(action, data);

        // Send - log but don't throw on failure
        try {
            await provider.sendNotification(notification);
            this.logger.debug('Notification sent successfully', { userId, action, gameName });
        } catch (error) {
            this.logger.error('Failed to send notification', error as Error, {
                userId,
                action,
                gameName
            });
            // Don't throw - notification send failures shouldn't crash the app
        }
    }

    /**
     * Notify user that a match has started
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyStartMatch("impostor", "user123", gameState);
     */
    async notifyStartMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.START_MATCH, gameState);
    }

    /**
     * Notify user that a new round has started
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyNextRound("impostor", "user123", gameState);
     */
    async notifyNextRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.NEXT_ROUND, gameState);
    }

    /**
     * Notify user of a middle round action (e.g., vote received)
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyMiddleRoundAction("impostor", "user123", gameState);
     */
    async notifyMiddleRoundAction(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.MIDDLE_ROUND_ACTION, gameState);
    }

    /**
     * Notify user that a round has finished
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyFinishRound("impostor", "user123", gameState);
     */
    async notifyFinishRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.FINISH_ROUND, gameState);
    }

    /**
     * Notify user that a match has finished
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyFinishMatch("impostor", "user123", gameState);
     */
    async notifyFinishMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.FINISH_MATCH, gameState);
    }

    /**
     * Notify user that a party has been created
     *
     * @param partyName - The name of the party
     * @param gameName - The name of the game
     * @param partyId - The ID of the party
     * @param userId - The user ID to notify
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyCreateParty("My Party", "impostor", "party123", "user123");
     */
    async notifyCreateParty(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        await this.notify(userId, gameName, ValidPartyActions.CREATE_PARTY, { partyName, partyId, gameName });
    }

    /**
     * Notify user that a player has joined the party
     *
     * @param partyName - The name of the party
     * @param gameName - The name of the game
     * @param partyId - The ID of the party
     * @param userId - The user ID to notify
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyPlayerJoined("My Party", "impostor", "party123", "user123");
     */
    async notifyPlayerJoined(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        await this.notify(userId, gameName, ValidPartyActions.PLAYER_JOINED, { partyName, partyId, gameName });
    }

    /**
     * Notify user that a player has left the party
     *
     * @param partyName - The name of the party
     * @param gameName - The name of the game
     * @param partyId - The ID of the party
     * @param userId - The user ID to notify
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyPlayerLeft("My Party", "impostor", "party123", "user123");
     */
    async notifyPlayerLeft(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        await this.notify(userId, gameName, ValidPartyActions.PLAYER_LEFT, { partyName, partyId, gameName });
    }

    /**
     * Notify user of an error
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param errorMessage - The user-friendly error message to send
     * @throws {NotificationError} If provider or formatter is not found
     *
     * @example
     * await manager.notifyError("impostor", "user123", "Party not found");
     */
    async notifyError(gameName: ValidGameNames, userId: string, errorMessage: string): Promise<void> {
        await this.notify(userId, gameName, ValidPartyActions.ERROR, { message: errorMessage });
    }

    /**
     * Convert a domain error to a user-friendly error message
     * Delegates to the formatter's error conversion logic
     *
     * @param gameName - The name of the game
     * @param error - The error to convert (can be any domain error type)
     * @returns A user-friendly error message string
     *
     * @example
     * const message = manager.convertErrorToMessage("impostor", new PartyError("Not found"));
     * // Returns: "Party not found. Create one with /create_party"
     */
    convertErrorToMessage(gameName: ValidGameNames, error: unknown): string {
        const formatter = this.formatters.get(`${gameName}-whatsapp` as FormatterKey) ||
                         this.formatters.get(`${gameName}-web_socket` as FormatterKey);

        if (!formatter) {
            // Fallback to generic error message if no formatter found
            return 'Something went wrong. Please try again';
        }

        return formatter.convertErrorToMessage(error);
    }
}