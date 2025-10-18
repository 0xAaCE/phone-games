import { User } from '@phone-games/db';
import { IUserRepository, CreateUserData } from '../../interfaces/userRepository.js';

export class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async create(userData: CreateUserData): Promise<User> {
    const user: User = {
      ...userData,
      email: userData.email ?? null,
      phoneNumber: userData.phoneNumber ?? null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.phoneNumber === phoneNumber) return user;
    }
    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return null;
  }

  async update(id: string, userData: Partial<CreateUserData>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    const updatedUser: User = {
      ...user,
      ...userData,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  async existsByPhone(phoneNumber: string): Promise<boolean> {
    return (await this.findByPhone(phoneNumber)) !== null;
  }

  // Helper methods for testing
  clear(): void {
    this.users.clear();
  }

  seed(users: User[]): void {
    users.forEach(user => this.users.set(user.id, user));
  }
}
