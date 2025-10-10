import { GameState, ValidGameNames } from "@phone-games/games";
import { Notification, ValidPartyActions, ValidNotificationMethods, ValidActions, ValidGameActions } from "./Notification.js";

export abstract class Parser {
    abstract parse<T extends ValidActions>(action: T, notification: T extends ValidGameActions ? GameState<ValidGameNames> : never): Promise<Notification>;
    abstract getGameName(): ValidGameNames;
    abstract getNotificationMethod(): ValidNotificationMethods;

    protected parsePlayerJoined(): Notification {
        return {
            title: "Impostor",
            body: "A new player has joined the game",
            action: ValidPartyActions.PLAYER_JOINED,
        };
    }

    protected parsePlayerLeft(): Notification {
        return {
            title: "Impostor",
            body: "A player has left the game",
            action: ValidPartyActions.PLAYER_LEFT,
        };
    }
}