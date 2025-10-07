import { User } from '@phone-games/db';
import { ImpostorCustomState, ImpostorFinishRoundParams, ImpostorFinishRoundResult, ImpostorMiddleRoundActionParams, ImpostorMiddleRoundActionResult, ImpostorNextRoundParams, ImpostorNextRoundResult } from './ImpostorGame';
import { GAME_NAMES } from '../constants/game'; 
export interface GamePlayer {
  user: User;
  isManager: boolean;
}

export interface GamePossibleCustomStates {
  [GAME_NAMES.IMPOSTOR]: ImpostorCustomState;
}

export interface NextRoundPossibleParams {
  [GAME_NAMES.IMPOSTOR]: ImpostorNextRoundParams;
}

export interface NextRoundPossibleResult {
  [GAME_NAMES.IMPOSTOR]: ImpostorNextRoundResult;
}

export interface MiddleRoundActionPossibleParams {
  [GAME_NAMES.IMPOSTOR]: ImpostorMiddleRoundActionParams;
}

export interface MiddleRoundActionPossibleResult {
  [GAME_NAMES.IMPOSTOR]: ImpostorMiddleRoundActionResult;
}

export interface FinishRoundPossibleParams {
  [GAME_NAMES.IMPOSTOR]: ImpostorFinishRoundParams;
}

export interface FinishRoundPossibleResult {
  [GAME_NAMES.IMPOSTOR]: ImpostorFinishRoundResult;
}

export type ValidGameNames = keyof GamePossibleCustomStates;
export type GameCustomState<T extends ValidGameNames> = GamePossibleCustomStates[T];
export type NextRoundParams<T extends ValidGameNames> = NextRoundPossibleParams[T];
export type NextRoundResult<T extends ValidGameNames> = NextRoundPossibleResult[T];
export type MiddleRoundActionParams<T extends ValidGameNames> = MiddleRoundActionPossibleParams[T];
export type MiddleRoundActionResult<T extends ValidGameNames> = MiddleRoundActionPossibleResult[T];
export type FinishRoundParams<T extends ValidGameNames> = FinishRoundPossibleParams[T];
export type FinishRoundResult<T extends ValidGameNames> = FinishRoundPossibleResult[T];

export interface GameState<T extends ValidGameNames> {
  currentRound: number;
  isFinished: boolean;
  winner?: string;
  players: GamePlayer[];
  customState: GameCustomState<T>;
}