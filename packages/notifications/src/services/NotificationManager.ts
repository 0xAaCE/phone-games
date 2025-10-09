import { FinishRoundResult, GameState, MiddleRoundActionResult, NextRoundResult, ValidGameNames } from "@phone-games/games";
import { NotificationService } from "../interfaces/NotificationService";
import { NotificationProvider } from "../interfaces/NotificationProvider";
import { Parser } from "../interfaces/Parser";
import { ValidNotificationMethods } from "../interfaces/Notification";

type ParserKey = `${ValidGameNames}-${ValidNotificationMethods}`;

export class NotificationManager implements NotificationService {
    private notificationProviders: Map<string, NotificationProvider> = new Map();
    private parsers: Map<ParserKey, Parser> = new Map();
    
    constructor(parsers: Parser[]) {
        parsers.forEach(parser => {
            this.parsers.set(this.getParserKey(parser), parser);
        });
    }

    private getParserKey(parser: Parser): ParserKey {
        return `${parser.getGameName()}-${parser.getNotificationMethod()}`;
    }

    private getProviderAndParser(userId: string, gameName: ValidGameNames): { provider: NotificationProvider, parser: Parser } {
        const provider = this.notificationProviders.get(userId);
        if (!provider) {
            throw new Error(`Notification provider not found for user ${userId}`);
        }
        const parser = this.parsers.get(`${gameName}-${provider.getNotificationMethod()}`);
        if (!parser) {
            throw new Error("Parser not found");
        }
        return { provider, parser };
    }

    async registerUser(userId: string, notificationMethod: NotificationProvider): Promise<void> {
        this.notificationProviders.set(userId, notificationMethod);
    }
    async unregisterUser(userId: string): Promise<void> {
        this.notificationProviders.delete(userId);
    }

    async notifyStartMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse({
            action: "start_match",
            ...gameState,
        });

        provider.sendNotification(notification);
    }

    async notifyNextRound(gameName: ValidGameNames, userId: string, nextRoundResult: NextRoundResult<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse({
            action: "next_round",
            ...nextRoundResult,
        });

        provider.sendNotification(notification);
    }
    async notifyMiddleRoundAction(gameName: ValidGameNames, userId: string, middleRoundActionResult: MiddleRoundActionResult<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse({
            action: "middle_round_action",
            ...middleRoundActionResult,
        });

        provider.sendNotification(notification);
    }
    async notifyFinishRound(gameName: ValidGameNames, userId: string, finishRoundResult: FinishRoundResult<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse({
            action: "finish_round",
            ...finishRoundResult,
        });

        provider.sendNotification(notification);
    }
    async notifyFinishMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse({
            action: "finish_match",
            ...gameState,
        });
        
        provider.sendNotification(notification);
    }   
}