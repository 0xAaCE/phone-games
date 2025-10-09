import { FinishRoundResult, GameState, MiddleRoundActionResult, NextRoundResult, ValidGameNames } from "@phone-games/games";
import { NotificationProvider } from "./NotificationProvider";

export abstract class NotificationService {
    abstract registerUser(userId: string, notificationMethod: NotificationProvider): Promise<void>;
    abstract unregisterUser(userId: string): Promise<void>;
    abstract notifyStartMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;
    abstract notifyNextRound(gameName: ValidGameNames, userId: string, nextRoundResult: NextRoundResult<ValidGameNames>): Promise<void>;
    abstract notifyMiddleRoundAction(gameName: ValidGameNames, userId: string, middleRoundActionResult: MiddleRoundActionResult<ValidGameNames>): Promise<void>;
    abstract notifyFinishRound(gameName: ValidGameNames, userId: string, finishRoundResult: FinishRoundResult<ValidGameNames>): Promise<void>;
    abstract notifyFinishMatch(gameName: ValidGameNames, userId: string, gameState: GameState<ValidGameNames>): Promise<void>;
}