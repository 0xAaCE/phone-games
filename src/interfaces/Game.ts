import { User } from '@db';
import { ImpostorCustomState } from './ImpostorGame';
import { GAME_NAMES } from '../constants/game';
export interface GamePlayer {
  user: User;
  isManager: boolean;
}

export interface CustomStates {
  [GAME_NAMES.IMPOSTOR]: ImpostorCustomState;
}

export type ValidGameNames = keyof CustomStates;

export type GameCustomState<T extends ValidGameNames> = CustomStates[T];

export interface GameState<T extends ValidGameNames> {
  currentRound: number;
  isFinished: boolean;
  winner?: string;
  players: GamePlayer[];
  customState: GameCustomState<T>;
}