import { PrismaClient, User } from '@phone-games/db';
import { ValidationError, ConflictError, NotFoundError } from '../errors/index.js';

export interface CreateUserData {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
}

export class UserService {
  constructor(private db: PrismaClient) {}

  async createUser(userData: CreateUserData): Promise<User> {
    await this.validateUserData(userData);

    return this.db.user.create({
      data: userData,
    });
  }

  async validateUserData(userData: CreateUserData): Promise<void> {
    // At least one of email or phoneNumber must be provided
    if (!userData.email && !userData.phoneNumber) {
      throw new ValidationError('Either email or phone number must be provided');
    }

    // Check if email exists (only if provided)
    if (userData.email) {
      const existingEmail = await this.emailExists(userData.email);
      if (existingEmail) {
        throw new ConflictError('Email already exists');
      }
    }

    // Check if phone exists (only if provided)
    if (userData.phoneNumber) {
      const existingPhone = await this.phoneExists(userData.phoneNumber);
      if (existingPhone) {
        throw new ConflictError('Phone number already exists');
      }
    }
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { email },
    });
    return !!user;
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { phoneNumber },
    });
    return !!user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { phoneNumber },
    });
  }

  async getUserByEmailOrPhone(emailOrPhone: string): Promise<User | null> {
    // Try to find by email first, then by phone
    const userByEmail = await this.getUserByEmail(emailOrPhone);
    if (userByEmail) return userByEmail;

    const userByPhone = await this.getUserByPhone(emailOrPhone);
    return userByPhone;
  }

  async updateUser(id: string, userData: Partial<CreateUserData>): Promise<User> {
    // Get current user data
    const currentUser = await this.getUserById(id);
    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // Validate that at least email or phone will remain after update
    const finalEmail = userData.email !== undefined ? userData.email : currentUser.email;
    const finalPhone = userData.phoneNumber !== undefined ? userData.phoneNumber : currentUser.phoneNumber;

    if (!finalEmail && !finalPhone) {
      throw new ValidationError('User must have at least email or phone number');
    }

    // Validate uniqueness for provided fields
    if (userData.email && userData.email !== currentUser.email) {
      const existingEmail = await this.emailExists(userData.email);
      if (existingEmail) {
        throw new ConflictError('Email already exists');
      }
    }

    if (userData.phoneNumber && userData.phoneNumber !== currentUser.phoneNumber) {
      const existingPhone = await this.phoneExists(userData.phoneNumber);
      if (existingPhone) {
        throw new ConflictError('Phone number already exists');
      }
    }

    return this.db.user.update({
      where: { id },
      data: userData,
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id },
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}