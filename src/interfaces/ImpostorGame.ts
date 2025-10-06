interface RoundState {
    impostorId: string;
    currentWord: string;
    votes: Map<string, string>; // voterId -> votedForId
    roundStarted: boolean;
    impostorWins?: boolean;
  }
  
interface WinHistory {
    roundNumber: number;
    winnerId: string;
    wasImpostor: boolean;
  }
  
export interface ImpostorCustomState {
    currentRoundState: RoundState;
    winHistory: WinHistory[];
  }
  