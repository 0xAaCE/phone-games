import { GameState, ValidGameNames } from "@phone-games/games";
import { NotificationService } from "../interfaces/notificationService.js";
import { NotificationProvider } from "../interfaces/notificationProvider.js";
import { Parser } from "../interfaces/parser.js";
import { ValidGameActions, ValidNotificationMethods, ValidPartyActions } from "../interfaces/notification.js";

type ParserKey = `${ValidGameNames}-${ValidNotificationMethods}`;

export class NotificationManager implements NotificationService {
    private notificationProviders: Map<string, NotificationProvider> = new Map();
    private parsers: Map<ParserKey, Parser> = new Map();
    
    constructor(parsers: Parser[]) {
        parsers.forEach(parser => {
            this.parsers.set(this.getParserKey(parser), parser);
        });
    }

    hasUser(userId: string): boolean {
        return this.notificationProviders.has(userId);
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

        const notification = await parser.parse(ValidGameActions.START_MATCH, gameState);

        await provider.sendNotification(notification);
    }

    async notifyNextRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse(ValidGameActions.NEXT_ROUND, gameState);

        await provider.sendNotification(notification);
    }
    async notifyMiddleRoundAction(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse(ValidGameActions.MIDDLE_ROUND_ACTION, gameState);

        await provider.sendNotification(notification);
    }
    async notifyFinishRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse(ValidGameActions.FINISH_ROUND, gameState);

        await provider.sendNotification(notification);
    }
    async notifyFinishMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse(ValidGameActions.FINISH_MATCH, gameState);
        
        await provider.sendNotification(notification);
    }   
    async notifyCreateParty(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse(ValidPartyActions.CREATE_PARTY, { partyName, partyId, gameName });

        await provider.sendNotification(notification);
    }
    async notifyPlayerJoined(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse(ValidPartyActions.PLAYER_JOINED, { partyName, partyId, gameName });

        console.log("Sending Join notification", notification);
        await provider.sendNotification(notification);
    }
    async notifyPlayerLeft(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        const { provider, parser } = this.getProviderAndParser(userId, gameName);

        const notification = await parser.parse(ValidPartyActions.PLAYER_LEFT, { partyName, partyId, gameName });

        await provider.sendNotification(notification);
    }
}