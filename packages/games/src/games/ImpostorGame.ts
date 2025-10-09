import { GamePlayer, GameState, NextRoundParams, NextRoundResult, ValidGameNames } from '../interfaces/Game';
import { GAME_NAMES } from '../constants/game';
import { Game } from './Game';
import { ImpostorFinishRoundParams, ImpostorFinishRoundResult, ImpostorMiddleRoundActionParams, ImpostorMiddleRoundActionResult } from '../interfaces/ImpostorGame';
export class ImpostorGame extends Game<GAME_NAMES.IMPOSTOR> {
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
  private gameState: GameState<GAME_NAMES.IMPOSTOR>;
  private currentImpostorId: string;
  private currentWord: string;

  constructor() {
    super();
    this.gameState = {
      currentRound: 0,
      isFinished: false,
      players: [],
      customState: {
        currentRoundState: {
          votes: {},
          roundEnded: true,
          word: '',
        },
        winHistory: [],
      },
    };
    this.currentImpostorId = '';
    this.currentWord = '';
  }

  getName(): ValidGameNames {
    return GAME_NAMES.IMPOSTOR;
  }

  async start(players: GamePlayer[]): Promise<GameState<GAME_NAMES.IMPOSTOR>> {
    if (players.length < 3) {
      throw new Error('Impostor game requires at least 3 players');
    }

    this.updateState({
      players,
    });

    return this.gameState;
  }

  async nextRound(
      nextRoundParams: NextRoundParams<GAME_NAMES.IMPOSTOR>
  ): Promise<NextRoundResult<GAME_NAMES.IMPOSTOR>> {
    if (!this.gameState?.customState.currentRoundState.roundEnded) {
      throw new Error('Cannot start next round while current round is still active');
    }

    // Select new impostor and word
    this.currentImpostorId = this.getRandomImpostorId();
    this.currentWord = this.getRandomWord();

    this.updateState({
      currentRound: this.gameState.currentRound + 1,
      customState: {
        ...this.gameState.customState,
        currentRoundState: {
          votes: {},
          impostorWins: false,
          roundEnded: false,
          word: this.currentWord,
        },
      },
    });

    return {
      word: nextRoundParams.userId === this.currentImpostorId ? this.currentWord : 'IMPOSTOR',
    };
  }

  async middleRoundAction(
    middleRoundActionParams: ImpostorMiddleRoundActionParams
  ): Promise<ImpostorMiddleRoundActionResult> {

    if (this.gameState.customState.currentRoundState.roundEnded) {
      throw new Error('Cannot vote after round has ended');
    }

    this.computeVotes(middleRoundActionParams.votes);

    return {
      votes: this.gameState.customState.currentRoundState.votes,
    };
  }

  async finishRound(
    _finishRoundParams: ImpostorFinishRoundParams
  ): Promise<ImpostorFinishRoundResult> {
    if (this.gameState.customState.currentRoundState.roundEnded) {
      throw new Error('Cannot finish round that has already ended');
    }

    const { votes } = this.gameState.customState.currentRoundState;

    // Count votes
    const voteCounts = new Map<string, number>();
    this.gameState.players.forEach(player => {
      voteCounts.set(player.user.id, 0);
    });

    Object.values(votes).forEach(votedForId => {
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
    const impostorWins = mostVotedId !== this.currentImpostorId;

    // Add to win history
    const newWinHistory = [
      ...this.gameState.customState.winHistory,
      {
        roundNumber: this.gameState.currentRound,
        wasImpostor: impostorWins,
      },
    ];

    this.updateState({
      winner: mostVotedId,
      customState: {
        ...this.gameState.customState,
        currentRoundState: {
          ...this.gameState.customState.currentRoundState,
          roundEnded: true,
          impostorWins,
        },
        winHistory: newWinHistory,
      },
    });


    return {
      roundFinished: true,
      impostorWins,
    };
  }

  async finishMatch(
  ): Promise<GameState<GAME_NAMES.IMPOSTOR>> {
    if (!this.gameState.customState.currentRoundState.roundEnded) {
      throw new Error('Cannot finish match while round is still active');
    }

    this.gameState = {
      ...this.gameState,
      isFinished: true,
    };

    return this.gameState
  }

  getGameState(userId: string): GameState<GAME_NAMES.IMPOSTOR> {

    if (userId === this.currentImpostorId) {
      return {
        ...this.gameState,
        customState: {
          ...this.gameState.customState,
          currentRoundState: { ...this.gameState.customState.currentRoundState, word: 'IMPOSTOR' },
        },
      };
    }
    return this.gameState;
  }

  private computeVotes(votes: { [voterId: string]: string }): void {
    for (const [voterId, votedForId] of Object.entries(votes)) {
      this.gameState.customState.currentRoundState.votes[voterId] = votedForId;
    }
  }

  private getRandomWord(): string {
    return this.words[Math.floor(Math.random() * this.words.length)];
  }

  private getRandomImpostorId(): string {
    return this.gameState.players[Math.floor(Math.random() * this.gameState.players.length)].user.id;
  }

  private updateState(update: Partial<GameState<GAME_NAMES.IMPOSTOR>>) {
    this.gameState = {
      ...this.gameState,
      ...update,
      customState: {
        ...this.gameState.customState,
        ...update.customState,
        currentRoundState: {
          ...this.gameState.customState.currentRoundState,
          ...update.customState?.currentRoundState,
        },
      },
    };
  }
}