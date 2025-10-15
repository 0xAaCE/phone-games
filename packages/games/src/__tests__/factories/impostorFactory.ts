import { GameState, GamePlayer } from '../../interfaces/Game.js';
import { GAME_NAMES } from '../../constants/game.js';
import { User } from '@phone-games/db';

export class ImpostorTestFactory {
  static createUser(overrides?: Partial<User>): User {
    return {
      id: 'player-1',
      username: 'TestPlayer',
      email: null,
      phoneNumber: '123456789',
      firebaseUid: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as User;
  }

  static createGamePlayer(overrides?: Partial<GamePlayer>): GamePlayer {
    return {
      user: this.createUser(),
      isManager: false,
      ...overrides,
    };
  }

  static createGameState(overrides?: Partial<GameState<GAME_NAMES.IMPOSTOR>>): GameState<GAME_NAMES.IMPOSTOR> {
    return {
      currentRound: 0,
      isFinished: false,
      players: [
        this.createGamePlayer({ user: this.createUser({ id: 'p1', username: 'Player1', phoneNumber: '111' }) }),
        this.createGamePlayer({ user: this.createUser({ id: 'p2', username: 'Player2', phoneNumber: '222' }) }),
        this.createGamePlayer({ user: this.createUser({ id: 'p3', username: 'Player3', phoneNumber: '333' }) }),
      ],
      customState: {
        currentRoundState: {
          votes: {},
          roundEnded: true,
          word: '',
        },
        winHistory: [],
      },
      ...overrides,
    };
  }

  static createPlayers(count: number): GamePlayer[] {
    return Array.from({ length: count }, (_, i) =>
      this.createGamePlayer({
        user: this.createUser({
          id: `p${i + 1}`,
          username: `Player${i + 1}`,
          phoneNumber: `${i + 1}${i + 1}${i + 1}`,
        }),
      })
    );
  }
}
