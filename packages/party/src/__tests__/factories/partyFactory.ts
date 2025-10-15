import { Party, PartyPlayer, PartyStatus, PlayerRole } from '@phone-games/db';
import { GamePlayer } from '@phone-games/games';

export class PartyTestFactory {
  static createParty(overrides?: Partial<Party>): Party {
    return {
      id: 'test-party-id',
      partyName: 'Test Party',
      gameName: 'impostor',
      status: PartyStatus.WAITING,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    } as Party;
  }

  static createPartyPlayer(overrides?: Partial<PartyPlayer>): PartyPlayer {
    return {
      partyId: 'test-party-id',
      userId: 'test-user-id',
      role: PlayerRole.PLAYER,
      joinedAt: new Date('2024-01-01'),
      ...overrides,
    } as PartyPlayer;
  }

  static createGamePlayer(overrides?: Partial<GamePlayer>): GamePlayer {
    return {
      user: {
        id: 'player-1',
        username: 'Player1',
        email: 'player1@test.com',
        phoneNumber: '1234567890',
        createdAt: new Date(),
      },
      isManager: false,
      ...overrides,
    };
  }

  static createGamePlayers(count: number): GamePlayer[] {
    return Array.from({ length: count }, (_, i) =>
      this.createGamePlayer({
        user: {
          id: `player-${i + 1}`,
          username: `Player${i + 1}`,
          email: `player${i + 1}@test.com`,
          phoneNumber: `${i + 1}234567890`,
          createdAt: new Date(),
        },
        isManager: i === 0, // First player is manager
      })
    );
  }

  static createPartyPlayers(partyId: string, userIds: string[]): PartyPlayer[] {
    return userIds.map((userId, index) =>
      this.createPartyPlayer({
        partyId,
        userId,
        role: index === 0 ? PlayerRole.MANAGER : PlayerRole.PLAYER,
      })
    );
  }
}
