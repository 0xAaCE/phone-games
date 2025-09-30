import { Game, GamePlayer, GameState } from '../interfaces/Game';

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

interface ImpostorCustomState {
  currentRoundState: RoundState;
  winHistory: WinHistory[];
}

export class ImpostorGame implements Game<ImpostorCustomState> {
  private words = [
    'pizza',
    'ocean',
    'mountain',
    'coffee',
    'guitar',
    'rainbow',
    'castle',
    'dragon',
    'sunset',
    'garden',
    'library',
    'bicycle',
    'chocolate',
    'thunder',
    'galaxy',
    'forest',
    'festival',
    'compass',
    'lighthouse',
    'volcano',
  ];
  private gameState?: GameState<ImpostorCustomState>;

  getName(): string {
    return 'Impostor';
  }

  async start(players: GamePlayer[]): Promise<GameState<ImpostorCustomState>> {
    if (players.length < 3) {
      throw new Error('Impostor game requires at least 3 players');
    }

    const impostorIndex = Math.floor(Math.random() * players.length);
    const impostorId = players[impostorIndex].user.id;
    const word = this.getRandomWord();

    this.gameState = {
      currentRound: 1,
      isFinished: false,
      players,
      customState: {
        currentRoundState: {
          impostorId,
          currentWord: word,
          votes: new Map(),
          roundStarted: true,
        },
        winHistory: [],
      },
    };

    return this.gameState;
  }

  async nextRound(
    gameState: GameState<ImpostorCustomState>
  ): Promise<GameState<ImpostorCustomState>> {
    if (gameState.customState.currentRoundState.roundStarted) {
      throw new Error('Cannot start next round while current round is still active');
    }

    // Select new impostor and word
    const impostorIndex = Math.floor(Math.random() * gameState.players.length);
    const impostorId = gameState.players[impostorIndex].user.id;
    const word = this.getRandomWord();

    this.gameState = {
      ...gameState,
      currentRound: gameState.currentRound + 1,
      customState: {
        ...gameState.customState,
        currentRoundState: {
          impostorId,
          currentWord: word,
          votes: new Map(),
          roundStarted: true,
        },
      },
    };

    return this.gameState;
  }

  async finishRound(
    gameState: GameState<ImpostorCustomState>
  ): Promise<GameState<ImpostorCustomState>> {
    if (!gameState.customState.currentRoundState.roundStarted) {
      throw new Error('Cannot finish round that has not started or is already finished');
    }

    const { impostorId, votes } = gameState.customState.currentRoundState;

    // Count votes
    const voteCounts = new Map<string, number>();
    gameState.players.forEach(player => {
      voteCounts.set(player.user.id, 0);
    });

    votes.forEach(votedForId => {
      voteCounts.set(votedForId, (voteCounts.get(votedForId) || 0) + 1);
    });

    // Find most voted player
    let mostVotedId = '';
    let maxVotes = 0;
    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedId = playerId;
      }
    });

    // Impostor wins if they are NOT the most voted player
    const impostorWins = mostVotedId !== impostorId;
    const winnerId = impostorWins ? impostorId : mostVotedId;

    // Add to win history
    const newWinHistory = [
      ...gameState.customState.winHistory,
      {
        roundNumber: gameState.currentRound,
        winnerId,
        wasImpostor: impostorWins,
      },
    ];

    this.gameState = {
      ...gameState,
      winner: winnerId,
      customState: {
        ...gameState.customState,
        currentRoundState: {
          ...gameState.customState.currentRoundState,
          roundStarted: false,
          impostorWins,
        },
        winHistory: newWinHistory,
      },
    };

    return this.gameState;
  }

  async finishMatch(
    gameState: GameState<ImpostorCustomState>
  ): Promise<GameState<ImpostorCustomState>> {
    if (gameState.customState.currentRoundState.roundStarted) {
      throw new Error('Cannot finish match while round is still active');
    }

    this.gameState = {
      ...gameState,
      isFinished: true,
    };

    return this.gameState;
  }

  private getRandomWord(): string {
    return this.words[Math.floor(Math.random() * this.words.length)];
  }
}