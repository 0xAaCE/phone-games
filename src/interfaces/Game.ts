import { User } from '@db';

export interface GamePlayer {
  user: User;
  isManager: boolean;
}

export interface GameState<T> {
  currentRound: number;
  isFinished: boolean;
  winner?: string;
  players: GamePlayer[];
  customState: T;
}

export interface Game<T> {
  getName(): string;
  start(players: GamePlayer[]): Promise<GameState<T>>;
  nextRound(gameState: GameState<T>): Promise<GameState<T>>;
  finishRound(gameState: GameState<T>): Promise<GameState<T>>;
  finishMatch(gameState: GameState<T>): Promise<GameState<T>>;
}