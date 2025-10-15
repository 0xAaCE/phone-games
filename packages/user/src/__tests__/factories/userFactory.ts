import { User } from '@phone-games/db';
import { CreateUserData } from '../../services/UserService.js';

export class UserTestFactory {
  static createUser(overrides?: Partial<User>): User {
    return {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      firebaseUid: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    } as User;
  }

  static createUserData(overrides?: Partial<CreateUserData>): CreateUserData {
    return {
      id: 'new-user-id',
      username: 'newuser',
      email: 'newuser@example.com',
      phoneNumber: '9876543210',
      ...overrides,
    };
  }

  static createUsers(count: number): User[] {
    return Array.from({ length: count }, (_, i) =>
      this.createUser({
        id: `user-${i + 1}`,
        username: `user${i + 1}`,
        email: `user${i + 1}@example.com`,
        phoneNumber: `${i + 1}234567890`,
      })
    );
  }
}
