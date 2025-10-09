import { GameState, ValidGameNames } from "@phone-games/games";

export enum ValidGameActions {
    START_MATCH = "start_match",
    NEXT_ROUND = "next_round",
    MIDDLE_ROUND_ACTION = "middle_round_action",
    FINISH_ROUND = "finish_round",
    FINISH_MATCH = "finish_match",
}

export enum ValidPartyActions {
    PLAYER_JOINED = "player_joined",
    PLAYER_LEFT = "player_left",
}

export type ValidActions = ValidGameActions | ValidPartyActions;

export type Notification = {
    title: string;
    body: string;
    action: ValidGameActions
    data: GameState<ValidGameNames>;
} | {
    title: string;
    body: string;
    action: ValidPartyActions;
    data?: never;
}

export enum NOTIFICATION_METHODS {
    WEB_SOCKET = "web_socket",
    WHATSAPP = "whatsapp",
}

export type ValidNotificationMethods = `${NOTIFICATION_METHODS}`;