import { GameState, ValidGameNames } from "@phone-games/games";
import { NotificationProvider } from "./notificationProvider.js";

/**
 * Abstract service interface for managing and sending game notifications to users
 *
 * Defines the contract for notification services that handle user registration,
 * game event notifications, party management notifications, and error notifications.
 * Implementations must provide notification delivery via various providers
 * (WhatsApp, WebSocket, etc.)
 *
 * @example
 * class MyNotificationService extends NotificationService {
 *   async notifyStartMatch(gameName, userId, gameState) {
 *     // Implementation
 *   }
 *   // ... implement other methods
 * }
 */
export abstract class NotificationService {
    /**
     * Check if a user is registered for notifications
     *
     * @param userId - The user ID to check
     * @returns true if the user has a registered notification provider
     *
     * @example
     * if (service.hasUser("user123")) {
     *   await service.notifyStartMatch("impostor", "user123", gameState);
     * }
     */
    abstract hasUser(userId: string): boolean;

    /**
     * Register a user for notifications with a specific provider
     *
     * @param userId - The user ID to register
     * @param notificationMethod - The notification provider instance (WhatsApp, WebSocket, etc.)
     *
     * @example
     * const provider = new WhatsappNotificationProvider(apiUrl, phoneId, token, user);
     * await service.registerUser("user123", provider);
     */
    abstract registerUser(userId: string, notificationMethod: NotificationProvider): Promise<void>;

    /**
     * Unregister a user from notifications
     * Removes the user's notification provider
     *
     * @param userId - The user ID to unregister
     *
     * @example
     * await service.unregisterUser("user123");
     */
    abstract unregisterUser(userId: string): Promise<void>;

    /**
     * Notify user that a match has started
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     *
     * @example
     * await service.notifyStartMatch("impostor", "user123", gameState);
     */
    abstract notifyStartMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;

    /**
     * Notify user that a new round has started
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     *
     * @example
     * await service.notifyNextRound("impostor", "user123", gameState);
     */
    abstract notifyNextRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;

    /**
     * Notify user of a middle round action (e.g., vote received)
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     *
     * @example
     * await service.notifyMiddleRoundAction("impostor", "user123", gameState);
     */
    abstract notifyMiddleRoundAction(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;

    /**
     * Notify user that a round has finished
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     *
     * @example
     * await service.notifyFinishRound("impostor", "user123", gameState);
     */
    abstract notifyFinishRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;

    /**
     * Notify user that a match has finished
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param gameState - The current game state
     *
     * @example
     * await service.notifyFinishMatch("impostor", "user123", gameState);
     */
    abstract notifyFinishMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;

    /**
     * Notify user that a party has been created
     *
     * @param partyName - The name of the party
     * @param gameName - The name of the game
     * @param partyId - The ID of the party
     * @param userId - The user ID to notify
     *
     * @example
     * await service.notifyCreateParty("My Party", "impostor", "party123", "user123");
     */
    abstract notifyCreateParty(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void>;

    /**
     * Notify user that a player has joined the party
     *
     * @param partyName - The name of the party
     * @param gameName - The name of the game
     * @param partyId - The ID of the party
     * @param userId - The user ID to notify
     *
     * @example
     * await service.notifyPlayerJoined("My Party", "impostor", "party123", "user123");
     */
    abstract notifyPlayerJoined(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void>;

    /**
     * Notify user that a player has left the party
     *
     * @param partyName - The name of the party
     * @param gameName - The name of the game
     * @param partyId - The ID of the party
     * @param userId - The user ID to notify
     *
     * @example
     * await service.notifyPlayerLeft("My Party", "impostor", "party123", "user123");
     */
    abstract notifyPlayerLeft(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void>;

    /**
     * Notify user of an error
     *
     * @param gameName - The name of the game
     * @param userId - The user ID to notify
     * @param errorMessage - The user-friendly error message to send
     *
     * @example
     * await service.notifyError("impostor", "user123", "Party not found");
     */
    abstract notifyError(gameName: ValidGameNames, userId: string, errorMessage: string): Promise<void>;

    /**
     * Convert a domain error to a user-friendly error message
     * Accesses the error's displayMessage property with fallback
     *
     * @param error - The error to convert (can be any domain error type)
     * @returns A user-friendly error message string
     *
     * @example
     * const message = service.convertErrorToMessage(new PartyError("Not found"));
     * // Returns: "Party not found. Create one with /create_party"
     */
    abstract convertErrorToMessage(error: unknown): string;
}