import { PrismaClient, User } from '@phone-games/db';
import { IUserRepository, CreateUserData } from '../interfaces/userRepository.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private db: PrismaClient) {}

  async create(userData: CreateUserData): Promise<User> {
    return this.db.user.create({
      data: userData,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { phoneNumber },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { username },
    });
  }

  async update(id: string, userData: Partial<CreateUserData>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: userData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return this.db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { email },
    });
    return !!user;
  }

  async existsByPhone(phoneNumber: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { phoneNumber },
    });
    return !!user;
  }
}
