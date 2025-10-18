import { vi } from 'vitest';
import { PrismaClient, User } from '@phone-games/db';

export class MockPrismaClient {
  static create(): PrismaClient {
    return {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaClient;
  }

  static mockUserCreate(mockPrisma: PrismaClient, returnValue: User) {
    (mockPrisma.user.create as any).mockResolvedValue(returnValue);
  }

  static mockUserFindUnique(mockPrisma: PrismaClient, returnValue: User | null) {
    (mockPrisma.user.findUnique as any).mockResolvedValue(returnValue);
  }

  static mockUserFindFirst(mockPrisma: PrismaClient, returnValue: User | null) {
    (mockPrisma.user.findFirst as any).mockResolvedValue(returnValue);
  }

  static mockUserFindMany(mockPrisma: PrismaClient, returnValue: User[]) {
    (mockPrisma.user.findMany as any).mockResolvedValue(returnValue);
  }

  static mockUserUpdate(mockPrisma: PrismaClient, returnValue: User) {
    (mockPrisma.user.update as any).mockResolvedValue(returnValue);
  }

  static mockUserDelete(mockPrisma: PrismaClient) {
    (mockPrisma.user.delete as any).mockResolvedValue(undefined);
  }
}
