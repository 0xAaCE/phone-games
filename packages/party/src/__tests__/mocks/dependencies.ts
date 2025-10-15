import { vi } from 'vitest';
import { PrismaClient, Party, PartyPlayer } from '@phone-games/db';
import { NotificationService } from '@phone-games/notifications';
import { Game, GameState, ValidGameNames } from '@phone-games/games';

export class MockPrismaClient {
  static create(): PrismaClient {
    return {
      party: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      partyPlayer: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback({
        party: {
          create: vi.fn(),
        },
        partyPlayer: {
          create: vi.fn(),
        },
      })),
    } as unknown as PrismaClient;
  }

  static mockPartyCreate(mockPrisma: PrismaClient, returnValue: Party) {
    (mockPrisma.party.create as any).mockResolvedValue(returnValue);
  }

  static mockPartyFindUnique(mockPrisma: PrismaClient, returnValue: Party | null) {
    (mockPrisma.party.findUnique as any).mockResolvedValue(returnValue);
  }

  static mockPartyPlayerCreate(mockPrisma: PrismaClient, returnValue: PartyPlayer) {
    (mockPrisma.partyPlayer.create as any).mockResolvedValue(returnValue);
  }

  static mockPartyPlayerFindFirst(mockPrisma: PrismaClient, returnValue: PartyPlayer | null) {
    (mockPrisma.partyPlayer.findFirst as any).mockResolvedValue(returnValue);
  }

  static mockPartyPlayerFindMany(mockPrisma: PrismaClient, returnValue: PartyPlayer[]) {
    (mockPrisma.partyPlayer.findMany as any).mockResolvedValue(returnValue);
  }
}

export class MockNotificationService {
  static create(): NotificationService {
    return {
      notifyCreateParty: vi.fn().mockResolvedValue(undefined),
      notifyPlayerJoined: vi.fn().mockResolvedValue(undefined),
      notifyPlayerLeft: vi.fn().mockResolvedValue(undefined),
      notifyStartMatch: vi.fn().mockResolvedValue(undefined),
      notifyNextRound: vi.fn().mockResolvedValue(undefined),
      notifyMiddleRoundAction: vi.fn().mockResolvedValue(undefined),
      notifyFinishRound: vi.fn().mockResolvedValue(undefined),
      notifyFinishMatch: vi.fn().mockResolvedValue(undefined),
    } as unknown as NotificationService;
  }
}

export class MockGame {
  static create<T extends ValidGameNames>(gameName: T): Game<T> {
    return {
      getName: vi.fn().mockReturnValue(gameName),
      start: vi.fn().mockResolvedValue({
        currentRound: 1,
        isFinished: false,
        players: [],
        customState: {},
      } as GameState<T>),
      nextRound: vi.fn().mockResolvedValue({ word: 'test-word' }),
      middleRoundAction: vi.fn().mockResolvedValue({ votes: {} }),
      finishRound: vi.fn().mockResolvedValue({ roundFinished: true }),
      finishMatch: vi.fn().mockResolvedValue({
        currentRound: 1,
        isFinished: true,
        players: [],
        customState: {},
      } as GameState<T>),
      getGameState: vi.fn().mockReturnValue({
        currentRound: 1,
        isFinished: false,
        players: [],
        customState: {},
      } as GameState<T>),
    } as unknown as Game<T>;
  }
}
