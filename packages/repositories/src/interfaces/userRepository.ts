import { User } from '@phone-games/db';

export interface CreateUserData {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
}

export interface IUserRepository {
  /**
   * Create a new user
   */
  create(userData: CreateUserData): Promise<User>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by phone number
   */
  findByPhone(phoneNumber: string): Promise<User | null>;

  /**
   * Find user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Update user
   */
  update(id: string, userData: Partial<CreateUserData>): Promise<User>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Get all users
   */
  findAll(): Promise<User[]>;

  /**
   * Check if email exists
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Check if phone number exists
   */
  existsByPhone(phoneNumber: string): Promise<boolean>;
}
