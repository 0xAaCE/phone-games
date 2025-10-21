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
     * @param action - The action that triggered this notification
     * @param notification - The data for this action (GameState for game actions, PartyParams/ErrorParams for party actions)
     * @returns A formatted notification ready to be sent to the user
     *
     * @example
     * const notification = await formatter.format(
     *   ValidGameActions.START_MATCH,
     *   gameState
     * );
     */
    abstract format<T extends ValidActions>(action: T, notification: T extends ValidGameActions ? GameState<ValidGameNames> : (PartyParams | ErrorParams)): Promise<Notification>;

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
     * Format a party creation notification
     * Common implementation used by all formatters
     *
     * @param params - The party parameters containing name, ID, and game name
     * @returns A formatted notification announcing the party creation
     *
     * @protected
     * @example
     * const notification = this.formatCreateParty({
     *   partyName: "Friday Night Games",
     *   partyId: "abc123",
     *   gameName: "impostor"
     * });
     */
    protected formatCreateParty(params: PartyParams): Notification {
        const body = `A new party has been created with \nId: ${params.partyId} \nName: ${params.partyName} for game ${params.gameName}`;

        return {
            title: "Party Created",
            body: body,
            action: ValidPartyActions.CREATE_PARTY,
        };
    }

    /**
     * Format a player joined notification
     * Common implementation used by all formatters
     *
     * @param params - The party parameters containing name, ID, and game name
     * @returns A formatted notification announcing that a player joined
     *
     * @protected
     * @example
     * const notification = this.formatPlayerJoined({
     *   partyName: "Friday Night Games",
     *   partyId: "abc123",
     *   gameName: "impostor"
     * });
     */
    protected formatPlayerJoined(params: PartyParams): Notification {
        return {
            title: "Player Joined",
            body: "A new player has joined the game \n\n" + params.partyName,
            action: ValidPartyActions.PLAYER_JOINED,
        };
    }

    /**
     * Format a player left notification
     * Common implementation used by all formatters
     *
     * @param params - The party parameters containing name, ID, and game name
     * @returns A formatted notification announcing that a player left
     *
     * @protected
     * @example
     * const notification = this.formatPlayerLeft({
     *   partyName: "Friday Night Games",
     *   partyId: "abc123",
     *   gameName: "impostor"
     * });
     */
    protected formatPlayerLeft(params: PartyParams): Notification {
        return {
            title: "Player Left",
            body: "A player has left the game \n\n" + params.partyName,
            action: ValidPartyActions.PLAYER_LEFT,
        };
    }

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