interface RoundState {
    votes: { [voterId: string]: string }; // voterId -> votedForId
    roundEnded: boolean;
    impostorWins?: boolean;
    word: string;
  }
  
interface WinHistory {
    roundNumber: number;
    wasImpostor: boolean;
  }
  
export interface ImpostorCustomState {
    currentRoundState: RoundState;
    winHistory: WinHistory[];
  }
  
export interface ImpostorNextRoundParams {
  userId: string;
}
  
export interface ImpostorNextRoundResult {
  word: string;
}

export interface ImpostorMiddleRoundActionParams {
   votes: {
    [voterId: string]: string;
   };
}

export interface ImpostorMiddleRoundActionResult {
  votes: {
    [voterId: string]: string;
  };
}
  
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ImpostorFinishRoundParams {
}
  
export interface ImpostorFinishRoundResult {
  roundFinished: boolean;
  impostorWins?: boolean;
}