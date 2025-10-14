import { GAME_NAMES, GameState, ValidGameNames } from "@phone-games/games";
import { Parser, PartyParams } from "../interfaces/Parser.js";
import { Notification, NOTIFICATION_METHODS, ValidActions, ValidGameActions, ValidNotificationMethods, ValidPartyActions } from "../interfaces/Notification.js";

export class ImpostorWebSocketParser extends Parser {
    constructor() {
        super();
    }

    async parse<T extends ValidActions>(action: T, notification: T extends ValidGameActions ? GameState<GAME_NAMES.IMPOSTOR> : PartyParams): Promise<Notification> {
        switch (action) {
            case ValidGameActions.START_MATCH:
                return this.parseStartMatch(notification as GameState<GAME_NAMES.IMPOSTOR>);
            case ValidGameActions.NEXT_ROUND:
                return this.parseNextRound(notification as GameState<GAME_NAMES.IMPOSTOR>);
            case ValidGameActions.MIDDLE_ROUND_ACTION:
                return this.parseMiddleRoundAction(notification as GameState<GAME_NAMES.IMPOSTOR>);
            case ValidGameActions.FINISH_ROUND:
                return this.parseFinishRound(notification as GameState<GAME_NAMES.IMPOSTOR>);
            case ValidGameActions.FINISH_MATCH:
                return this.parseFinishMatch(notification as GameState<GAME_NAMES.IMPOSTOR>);
            case ValidPartyActions.PLAYER_JOINED:
                return this.parsePlayerJoined(notification as PartyParams);
            case ValidPartyActions.PLAYER_LEFT:
                return this.parsePlayerLeft(notification as PartyParams);
            case ValidPartyActions.CREATE_PARTY:
                return this.parseCreateParty(notification as PartyParams);
            default:
                throw new Error("Invalid action");
        }
    }

    private async parseStartMatch(notification: GameState<GAME_NAMES.IMPOSTOR>): Promise<Notification> {
        return {
            title: "Impostor",
            body: "The game has started and players are: \n\n" + notification.players.map(player => player.user.username).join("\n"),
            action: ValidGameActions.START_MATCH,
            data: notification,
        };
    }

    private async parseNextRound(notification: GameState<GAME_NAMES.IMPOSTOR>): Promise<Notification> {
        return {
            title: "Impostor",
            body: "The next round has started and your word is: \n\n" + notification.customState.currentRoundState.word,
            action: ValidGameActions.NEXT_ROUND,
            data: notification,
        };
    }

    private async parseMiddleRoundAction(notification: GameState<GAME_NAMES.IMPOSTOR>): Promise<Notification> {
        return {
            title: "Impostor",
            body: "Your vote has been counted",
            action: ValidGameActions.MIDDLE_ROUND_ACTION,
            data: notification,
        };
    }

    private async parseFinishRound(notification: GameState<GAME_NAMES.IMPOSTOR>): Promise<Notification> {
        return {
            title: "Impostor",
            body: "The round has finished and the impostor has " + notification.customState.currentRoundState.impostorWins ? "won" : "lost",
            action: ValidGameActions.FINISH_ROUND,
            data: notification,
        };
    }

    private async parseFinishMatch(notification: GameState<GAME_NAMES.IMPOSTOR>): Promise<Notification> {
        return {
            title: "Impostor",
            body: "The match has finished",
            action: ValidGameActions.FINISH_MATCH,
            data: notification,
        };
    }

    getNotificationMethod(): ValidNotificationMethods {
        return NOTIFICATION_METHODS.WEB_SOCKET;
    }

    getGameName(): ValidGameNames {
        return GAME_NAMES.IMPOSTOR;
    }
}