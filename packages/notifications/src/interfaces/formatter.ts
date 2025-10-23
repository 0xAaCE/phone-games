import { GameState, ValidGameNames } from "@phone-games/games";
import { Notification, ValidPartyActions, ValidNotificationMethods, ValidActions, ValidGameActions, ErrorParams } from "./notification.js";

/**
 * Parameters for party-related notifications
 * Contains the core information needed to format party notifications
 */
export type PartyParams = {
    /** The display name of the party */
    partyName: string;
    /** The unique identifier for the party */
    partyId: string;
    /** The name of the game associated with this party */
    gameName: ValidGameNames;
}

/**
 * Abstract base class for notification formatters
 *
 * Implements the Strategy Pattern to encapsulate notification formatting logic
 * for different game/notification method combinations. Each concrete formatter
 * handles a specific combination (e.g., Impostor game + WhatsApp).
 *
 * Provides common formatting methods for party actions that are shared across
 * all formatters, while requiring concrete implementations to handle game-specific
 * formatting logic.
 *
 * @example
 * class WhatsAppImpostorFormatter extends Formatter {
 *   getGameName() { return GAME_NAMES.IMPOSTOR; }
 *   getNotificationMethod() { return "whatsapp"; }
 *
 *   async format(action, data) {
 *     if (action === ValidGameActions.START_MATCH) {
 *       return this.formatStartMatch(data);
 *     }
 *     // ... handle other actions
 *   }
 * }
 */
export abstract class Formatter {
    /**
     * Format a notification for a specific action
     *
     * Uses TypeScript conditional types to enforce type safety:
     * - Game actions (START_MATCH, NEXT_ROUND, etc.) receive GameState data
     * - Party actions (CREATE_PARTY, PLAYER_JOINED, etc.) receive PartyParams or ErrorParams
     *
     * Supports internationalization by detecting language from phone number country code.
     *
     * @param action - The action that triggered this notification
     * @param notification - The data for this action (GameState for game actions, PartyParams/ErrorParams for party actions)
     * @param phoneNumber - Optional phone number to detect language (defaults to 'en' if not provided)
     * @returns A formatted notification ready to be sent to the user
     *
     * @example
     * const notification = await formatter.format(
     *   ValidGameActions.START_MATCH,
     *   gameState,
     *   '+525512345678' // Mexican number, will use Spanish
     * );
     */
    abstract format<T extends ValidActions>(action: T, notification: T extends ValidGameActions ? GameState<ValidGameNames> : (PartyParams | ErrorParams), phoneNumber?: string | null): Promise<Notification>;

    /**
     * Get the game name this formatter handles
     *
     * @returns The name of the game (e.g., "impostor")
     *
     * @example
     * const gameName = formatter.getGameName(); // "impostor"
     */
    abstract getGameName(): ValidGameNames;

    /**
     * Get the notification method this formatter handles
     *
     * @returns The notification method (e.g., "whatsapp", "websocket")
     *
     * @example
     * const method = formatter.getNotificationMethod(); // "whatsapp"
     */
    abstract getNotificationMethod(): ValidNotificationMethods;

    /**
     * Format an error notification
     * Common implementation used by all formatters
     *
     * @param params - The error parameters containing the user-friendly message
     * @returns A formatted notification displaying the error to the user
     *
     * @protected
     * @example
     * const notification = this.formatError({
     *   message: "Party not found. Create one with /create_party"
     * });
     */
    protected formatError(params: ErrorParams): Notification {
        return {
            title: "Error",
            body: params.message,
            action: ValidPartyActions.ERROR,
        };
    }
}