import { vi } from 'vitest';
import { UserService } from '@phone-games/user';
import { User } from '@phone-games/db';

export class MockUserService {
  static create(customBehavior?: Partial<UserService>): UserService {
    return {
      createUser: vi.fn().mockResolvedValue({
        id: 'mock-user-id',
        username: 'mockuser',
        phoneNumber: '1234567890',
      } as User),

      getUserById: vi.fn().mockResolvedValue({
        id: 'mock-user-id',
        username: 'mockuser',
        phoneNumber: '1234567890',
      } as User),

      getUserByUsername: vi.fn().mockResolvedValue({
        id: 'mock-user-id',
        username: 'mockuser',
        phoneNumber: '1234567890',
      } as User),

      getUserByPhoneNumber: vi.fn().mockResolvedValue({
        id: 'mock-user-id',
        username: 'mockuser',
        phoneNumber: '1234567890',
      } as User),

      updateUser: vi.fn().mockResolvedValue({
        id: 'mock-user-id',
        username: 'mockuser',
        phoneNumber: '1234567890',
      } as User),

      ...customBehavior,
    } as unknown as UserService;
  }
}
