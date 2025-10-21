import { GameState, ValidGameNames } from "@phone-games/games";
import { Notification, ValidPartyActions, ValidNotificationMethods, ValidActions, ValidGameActions, ErrorParams } from "./notification.js";
import {
    MessageParsingError,
    PartyError,
    UserError,
    GameError,
    ValidationError,
    NotFoundError
} from "@phone-games/errors";

export type PartyParams = {
    partyName: string;
    partyId: string;
    gameName: ValidGameNames;
}

export abstract class Formatter {
    abstract format<T extends ValidActions>(action: T, notification: T extends ValidGameActions ? GameState<ValidGameNames> : (PartyParams | ErrorParams)): Promise<Notification>;
    abstract getGameName(): ValidGameNames;
    abstract getNotificationMethod(): ValidNotificationMethods;

    protected formatCreateParty(params: PartyParams): Notification {
        const body = `A new party has been created with \nId: ${params.partyId} \nName: ${params.partyName} for game ${params.gameName}`;

        return {
            title: "Party Created",
            body: body,
            action: ValidPartyActions.CREATE_PARTY,
        };
    }

    protected formatPlayerJoined(params: PartyParams): Notification {
        return {
            title: "Player Joined",
            body: "A new player has joined the game \n\n" + params.partyName,
            action: ValidPartyActions.PLAYER_JOINED,
        };
    }

    protected formatPlayerLeft(params: PartyParams): Notification {
        return {
            title: "Player Left",
            body: "A player has left the game \n\n" + params.partyName,
            action: ValidPartyActions.PLAYER_LEFT,
        };
    }

    protected formatError(params: ErrorParams): Notification {
        return {
            title: "Error",
            body: params.message,
            action: ValidPartyActions.ERROR,
        };
    }

    /**
     * Converts domain errors to user-friendly error messages
     * Can be overridden by subclasses for game-specific error messages
     */
    public convertErrorToMessage(error: unknown): string {
        if (error instanceof PartyError) {
            return 'Party not found. Create one with /create_party';
        }

        if (error instanceof UserError) {
            return 'User not found';
        }

        if (error instanceof GameError) {
            return 'Game error. Please try again';
        }

        if (error instanceof ValidationError) {
            return (error as Error).message || 'Invalid input';
        }

        if (error instanceof NotFoundError) {
            return (error as Error).message || 'Resource not found';
        }

        if (error instanceof MessageParsingError) {
            return 'Unknown command. Type /help for available commands';
        }

        if (error instanceof Error && error.message.includes('Unknown command')) {
            return 'Unknown command. Type /help for available commands';
        }

        // Default error message
        return 'Something went wrong. Please try again';
    }
}