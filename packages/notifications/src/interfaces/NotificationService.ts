import { GameState, ValidGameNames } from "@phone-games/games";
import { NotificationProvider } from "./NotificationProvider.js";

export abstract class NotificationService {
    abstract hasUser(userId: string): boolean;
    abstract registerUser(userId: string, notificationMethod: NotificationProvider): Promise<void>;
    abstract unregisterUser(userId: string): Promise<void>;
    abstract notifyStartMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;
    abstract notifyNextRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;
    abstract notifyMiddleRoundAction(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;
    abstract notifyFinishRound(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;
    abstract notifyFinishMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;
    abstract notifyCreateParty(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void>;
    abstract notifyPlayerJoined(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void>;
    abstract notifyPlayerLeft(partyName: string, gameName: ValidGameNames, partyId: string, userId: string): Promise<void>;
}