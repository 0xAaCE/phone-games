import { GamePlayer, GameState, ValidGameNames } from "src/interfaces/Game";

export abstract class Game<T extends ValidGameNames> {
    abstract getName(): string;
    abstract start(players: GamePlayer[]): Promise<GameState<T>>;
    abstract nextRound(gameState: GameState<T>): Promise<GameState<T>>;
    abstract finishRound(gameState: GameState<T>): Promise<GameState<T>>;
    abstract finishMatch(gameState: GameState<T>): Promise<GameState<T>>;
}