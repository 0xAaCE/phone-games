import { GameState, ValidGameNames } from "@phone-games/games";
import { NotificationError } from "@phone-games/errors";
import { ILogger } from "@phone-games/logger";
import { 
    NotificationService, 
    NotificationProvider, 
    Formatter, 
    PartyParams,
    ValidActions,
    ValidGameActions,
    ValidNotificationMethods,
    ValidPartyActions
} from "../internal.js";

type FormatterKey = `${ValidGameNames}-${ValidNotificationMethods}`;

export class NotificationManager implements NotificationService {
    private notificationProviders: Map<string, NotificationProvider> = new Map();
    private formatters: Map<FormatterKey, Formatter> = new Map();
    private logger: ILogger;

    constructor(formatters: Formatter[], logger: ILogger) {
        formatters.forEach(formatter => {
            this.formatters.set(this.getFormatterKey(formatter), formatter);
        });
        this.logger = logger.child({ service: 'NotificationManager' });
    }

    hasUser(userId: string): boolean {
        return this.notificationProviders.has(userId);
    }

    private getFormatterKey(formatter: Formatter): FormatterKey {
        return `${formatter.getGameName()}-${formatter.getNotificationMethod()}`;
    }

    private getProviderAndFormatter(userId: string, gameName: ValidGameNames): { provider: NotificationProvider, formatter: Formatter } {
        const provider = this.notificationProviders.get(userId);
        if (!provider) {
            throw new NotificationError(`Notification provider not found for user ${userId}`);
        }
        const formatter = this.formatters.get(`${gameName}-${provider.getNotificationMethod()}`);
        if (!formatter) {
            throw new NotificationError("Formatter not found");
        }
        return { provider, formatter };
    }

    async registerUser(userId: string, notificationMethod: NotificationProvider): Promise<void> {
        this.notificationProviders.set(userId, notificationMethod);
    }
    async unregisterUser(userId: string): Promise<void> {
        this.notificationProviders.delete(userId);
    }

    /**
     * Template Method Pattern - defines the notification algorithm.
     * All notification methods delegate to this common implementation.
     *
     * Algorithm:
     * 1. Get provider and formatter for user/game (throws on validation errors)
     * 2. Format notification content
     * 3. Send notification via provider (logs but doesn't throw on send errors)
     *
     * Note: Validation errors (no provider, no formatter) are thrown.
     * Network/send errors are logged but swallowed to prevent crashes.
     */
    private async notify<T extends ValidActions>(
        userId: string,
        gameName: ValidGameNames,
        action: T,
        data: T extends ValidGameActions ? GameState<ValidGameNames> : PartyParams
    ): Promise<void> {
        // Validation - throw if provider/formatter not found
        const { provider, formatter } = this.getProviderAndFormatter(userId, gameName);
        const notification = await formatter.format(action, data);

        // Send - log but don't throw on failure
        try {
            await provider.sendNotification(notification);
            this.logger.debug('Notification sent successfully', { userId, action, gameName });
        } catch (error) {
            this.logger.error('Failed to send notification', error as Error, {
                userId,
                action,
                gameName
            });
            // Don't throw - notification send failures shouldn't crash the app
        }
    }

    async notifyStartMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.START_MATCH, gameState);
    }

    async notifyNextRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.NEXT_ROUND, gameState);
    }

    async notifyMiddleRoundAction(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.MIDDLE_ROUND_ACTION, gameState);
    }

    async notifyFinishRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.FINISH_ROUND, gameState);
    }

    async notifyFinishMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void> {
        await this.notify(userId, gameName, ValidGameActions.FINISH_MATCH, gameState);
    }

    async notifyCreateParty(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        await this.notify(userId, gameName, ValidPartyActions.CREATE_PARTY, { partyName, partyId, gameName });
    }

    async notifyPlayerJoined(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        await this.notify(userId, gameName, ValidPartyActions.PLAYER_JOINED, { partyName, partyId, gameName });
    }

    async notifyPlayerLeft(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void> {
        await this.notify(userId, gameName, ValidPartyActions.PLAYER_LEFT, { partyName, partyId, gameName });
    }
}