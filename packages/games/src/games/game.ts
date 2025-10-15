import { FinishRoundParams, FinishRoundResult, GamePlayer, GameState, MiddleRoundActionParams, MiddleRoundActionResult, NextRoundParams, NextRoundResult, ValidGameNames } from "../internal.js";

export abstract class Game<T extends ValidGameNames> {
    abstract getName(): ValidGameNames;
    abstract start(players: GamePlayer[]): Promise<GameState<T>>;
    abstract nextRound(nextRoundParams: NextRoundParams<T>): Promise<NextRoundResult<T>>;
    abstract middleRoundAction(middleRoundActionParams: MiddleRoundActionParams<T>): Promise<MiddleRoundActionResult<T>>;
    abstract finishRound(finishRoundParams: FinishRoundParams<T>): Promise<FinishRoundResult<T>>;
    abstract finishMatch(): Promise<GameState<T>>;
    abstract getGameState(userId: string): GameState<T>;
}