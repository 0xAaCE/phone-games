import { GAME_NAMES, ValidGameNames } from "@phone-games/games";
import { Parser } from "../interfaces/Parser";
import { FinishMatchDataType, FinishRoundDataType, MiddleRoundActionDataType, NextRoundDataType, Notification, NOTIFICATION_METHODS, NotificationDataType, StartMatchDataType, ValidNotificationMethods } from "../interfaces/Notification";

export class ImpostorWebSocketParser extends Parser {
    constructor() {
        super();
    }

    async parse(notification: NotificationDataType): Promise<Notification> {
        switch (notification.action) {
            case "start_match":
                return this.parseStartMatch(notification);
            case "next_round":
                return this.parseNextRound(notification);
            case "middle_round_action":
                return this.parseMiddleRoundAction(notification);
            case "finish_round":
                return this.parseFinishRound(notification);
            case "finish_match":
                return this.parseFinishMatch(notification);
            default:
                throw new Error("Invalid action");
        }
    }

    private async parseStartMatch(notification: StartMatchDataType): Promise<Notification> {
        return {
            title: "Impostor",
            body: "The game has started and players are: \n\n" + notification.players.map(player => player.user.username).join("\n"),
            data: notification,
        };
    }

    private async parseNextRound(notification: NextRoundDataType): Promise<Notification> {
        return {
            title: "Impostor",
            body: "The next round has started and your word is: \n\n" + notification.word,
            data: notification,
        };
    }

    private async parseMiddleRoundAction(notification: MiddleRoundActionDataType): Promise<Notification> {
        return {
            title: "Impostor",
            body: "Your vote has been counted",
            data: notification,
        };
    }

    private async parseFinishRound(notification: FinishRoundDataType): Promise<Notification> {
        return {
            title: "Impostor",
            body: "The round has finished and the impostor has been: \n\n" + notification.impostorWins ? "won" : "lost",
            data: notification,
        };
    }

    private async parseFinishMatch(notification: FinishMatchDataType): Promise<Notification> {
        return {
            title: "Impostor",
            body: "The match has finished",
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