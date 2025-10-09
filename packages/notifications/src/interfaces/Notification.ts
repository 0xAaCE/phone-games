import { FinishRoundResult, GameState, MiddleRoundActionResult, NextRoundResult, ValidGameNames } from "@phone-games/games";

export interface StartMatchDataType extends GameState<ValidGameNames> {
    action: "start_match";
}
export interface NextRoundDataType extends NextRoundResult<ValidGameNames> {
    action: "next_round";
}
export interface MiddleRoundActionDataType extends MiddleRoundActionResult<ValidGameNames> {
    action: "middle_round_action";
}
export interface FinishRoundDataType extends FinishRoundResult<ValidGameNames> {
    action: "finish_round";
}
export interface FinishMatchDataType extends GameState<ValidGameNames> {
    action: "finish_match";
}

export type NotificationDataType = StartMatchDataType | NextRoundDataType | MiddleRoundActionDataType | FinishRoundDataType | FinishMatchDataType;

export interface Notification {
    title: string;
    body: string;
    data: NotificationDataType;
}

export enum NOTIFICATION_METHODS {
    WEB_SOCKET = "web_socket",
    WHATSAPP = "whatsapp",
}

export type ValidNotificationMethods = `${NOTIFICATION_METHODS}`;