import { GameState, ValidGameNames } from "@phone-games/games";
import { Notification, ValidPartyActions, ValidNotificationMethods, ValidActions, ValidGameActions } from "./notification.js";

export type PartyParams = {
    partyName: string;
    partyId: string;
    gameName: ValidGameNames;
}

export abstract class Formatter {
    abstract format<T extends ValidActions>(action: T, notification: T extends ValidGameActions ? GameState<ValidGameNames> : PartyParams): Promise<Notification>;
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
}