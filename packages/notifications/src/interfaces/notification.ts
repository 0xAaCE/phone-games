import { GameState, ValidGameNames } from "@phone-games/games";

/**
 * Valid actions that can occur during game play
 * These actions trigger notifications to players about game state changes
 *
 * @example
 * ValidGameActions.START_MATCH // "start_match"
 * ValidGameActions.NEXT_ROUND // "next_round"
 */
export enum ValidGameActions {
    /** Match has started - all players are notified */
    START_MATCH = "start_match",
    /** New round has started - players receive their word/role */
    NEXT_ROUND = "next_round",
    /** Middle of round action occurred (e.g., vote received) */
    MIDDLE_ROUND_ACTION = "middle_round_action",
    /** Round has finished - results are announced */
    FINISH_ROUND = "finish_round",
    /** Match has finished - final results */
    FINISH_MATCH = "finish_match",
}

/**
 * Valid actions related to party management
 * These actions trigger notifications about party status changes
 *
 * @example
 * ValidPartyActions.CREATE_PARTY // "create_party"
 * ValidPartyActions.ERROR // "error"
 */
export enum ValidPartyActions {
    /** A new party has been created */
    CREATE_PARTY = "create_party",
    /** A player has joined the party */
    PLAYER_JOINED = "player_joined",
    /** A player has left the party */
    PLAYER_LEFT = "player_left",
    /** An error occurred that should be shown to the user */
    ERROR = "error",
}

/**
 * Union type of all valid action types
 * Used for type-safe action handling across the notification system
 *
 * @example
 * function handleAction(action: ValidActions) {
 *   if (action === ValidGameActions.START_MATCH) { ... }
 *   if (action === ValidPartyActions.CREATE_PARTY) { ... }
 * }
 */
export type ValidActions = ValidGameActions | ValidPartyActions;

/**
 * Discriminated union type for notifications
 * Game actions include full game state data, party actions don't
 *
 * This type ensures type safety:
 * - Game action notifications MUST include game state data
 * - Party action notifications MUST NOT include data field
 *
 * @example
 * // Game notification with data
 * const gameNotification: Notification = {
 *   title: "Round Started",
 *   body: "Your word is: apple",
 *   action: ValidGameActions.NEXT_ROUND,
 *   data: gameState
 * };
 *
 * // Party notification without data
 * const partyNotification: Notification = {
 *   title: "Party Created",
 *   body: "Party 'My Party' created",
 *   action: ValidPartyActions.CREATE_PARTY
 * };
 */
export type Notification<templateType = unknown> = {
    /** Notification title shown to the user */
    title: string;
    /** Notification body/message content */
    body: string;
    /** The game action that triggered this notification */
    action: ValidGameActions
    /** Full game state for the current game */
    data: GameState<ValidGameNames>;
    /** Template for the notification */
    template?: templateType;
} | {
    /** Notification title shown to the user */
    title: string;
    /** Notification body/message content */
    body: string;
    /** The party action that triggered this notification */
    action: ValidPartyActions;
    /** Party actions don't include data field */
    data?: never;
    /** Template for the notification */
    template?: never;
}

/**
 * Parameters for error notifications
 * Contains the user-friendly error message to display
 *
 * @example
 * const errorParams: ErrorParams = {
 *   message: "Party not found. Create one with /create_party"
 * };
 */
export type ErrorParams = {
    /** User-friendly error message to display */
    message: string;
}

/**
 * Available notification delivery methods
 * Determines how notifications are sent to users
 *
 * @example
 * NOTIFICATION_METHODS.WHATSAPP // "whatsapp"
 * NOTIFICATION_METHODS.WEB_SOCKET // "web_socket"
 */
export enum NOTIFICATION_METHODS {
    /** WebSocket-based real-time notifications */
    WEB_SOCKET = "web_socket",
    /** WhatsApp messages via WhatsApp Business API */
    WHATSAPP = "whatsapp",
    /** Twilio messages via Twilio API */
    TWILIO = "twilio",
}

/**
 * String literal type derived from NOTIFICATION_METHODS enum
 * Used for type-safe notification method strings
 *
 * @example
 * const method: ValidNotificationMethods = "whatsapp"; // Valid
 * const invalid: ValidNotificationMethods = "email"; // Type error
 */
export type ValidNotificationMethods = `${NOTIFICATION_METHODS}`;