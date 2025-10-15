import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../../services/UserService.js';
import { ValidationError, ConflictError, NotFoundError } from '../../errors/index.js';
import { UserTestFactory } from '../factories/userFactory.js';
import { MockPrismaClient } from '../mocks/prisma.js';
import { PrismaClient } from '@phone-games/db';

describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = MockPrismaClient.create();
    userService = new UserService(mockPrisma);
  });

  describe('createUser', () => {
    it('should create a user with email', async () => {
      const { phoneNumber: _phoneNumber, ...userData } = UserTestFactory.createUserData({ email: 'test@example.com' });
      const expectedUser = UserTestFactory.createUser(userData);

      MockPrismaClient.mockUserFindUnique(mockPrisma, null); // email doesn't exist
      MockPrismaClient.mockUserCreate(mockPrisma, expectedUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(expectedUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
    });

    it('should create a user with phone number', async () => {
      const { email: _email, ...userData } = UserTestFactory.createUserData({ phoneNumber: '1234567890' });
      const expectedUser = UserTestFactory.createUser(userData);

      MockPrismaClient.mockUserFindUnique(mockPrisma, null); // phone doesn't exist
      MockPrismaClient.mockUserCreate(mockPrisma, expectedUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(expectedUser);
    });

    it('should create a user with both email and phone', async () => {
      const userData = UserTestFactory.createUserData();
      const expectedUser = UserTestFactory.createUser(userData);

      MockPrismaClient.mockUserFindUnique(mockPrisma, null);
      MockPrismaClient.mockUserCreate(mockPrisma, expectedUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(expectedUser);
    });

    it('should throw ValidationError if neither email nor phone provided', async () => {
      const { email: _email, phoneNumber: _phoneNumber, ...userData } = UserTestFactory.createUserData();

      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError);
      await expect(userService.createUser(userData)).rejects.toThrow(
        'Either email or phone number must be provided'
      );
    });

    it('should throw ConflictError if email already exists', async () => {
      const userData = UserTestFactory.createUserData({ email: 'existing@example.com' });
      const existingUser = UserTestFactory.createUser({ email: 'existing@example.com' });

      MockPrismaClient.mockUserFindUnique(mockPrisma, existingUser);

      await expect(userService.createUser(userData)).rejects.toThrow(ConflictError);
      await expect(userService.createUser(userData)).rejects.toThrow('Email already exists');
    });

    it('should throw ConflictError if phone already exists', async () => {
      const { email: _email, ...userData } = UserTestFactory.createUserData({ phoneNumber: '1234567890' });
      const existingUser = UserTestFactory.createUser({ phoneNumber: '1234567890' });

      MockPrismaClient.mockUserFindUnique(mockPrisma, existingUser);

      await expect(userService.createUser(userData)).rejects.toThrow(ConflictError);
      await expect(userService.createUser(userData)).rejects.toThrow('Phone number already exists');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const user = UserTestFactory.createUser();
      MockPrismaClient.mockUserFindUnique(mockPrisma, user);

      const result = await userService.getUserById(user.id);

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: user.id } });
    });

    it('should return null if user not found', async () => {
      MockPrismaClient.mockUserFindUnique(mockPrisma, null);

      const result = await userService.getUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found by email', async () => {
      const user = UserTestFactory.createUser({ email: 'test@example.com' });
      MockPrismaClient.mockUserFindUnique(mockPrisma, user);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null if user not found', async () => {
      MockPrismaClient.mockUserFindUnique(mockPrisma, null);

      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserByPhone', () => {
    it('should return user if found by phone', async () => {
      const user = UserTestFactory.createUser({ phoneNumber: '1234567890' });
      MockPrismaClient.mockUserFindUnique(mockPrisma, user);

      const result = await userService.getUserByPhone('1234567890');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { phoneNumber: '1234567890' } });
    });

    it('should return null if user not found', async () => {
      MockPrismaClient.mockUserFindUnique(mockPrisma, null);

      const result = await userService.getUserByPhone('9999999999');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user if found by username', async () => {
      const user = UserTestFactory.createUser({ username: 'testuser' });
      MockPrismaClient.mockUserFindFirst(mockPrisma, user);

      const result = await userService.getUserByUsername('testuser');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({ where: { username: 'testuser' } });
    });

    it('should return null if user not found', async () => {
      MockPrismaClient.mockUserFindFirst(mockPrisma, null);

      const result = await userService.getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmailOrPhone', () => {
    it('should return user if found by email', async () => {
      const user = UserTestFactory.createUser({ email: 'test@example.com' });

      (mockPrisma.user.findUnique as any)
        .mockResolvedValueOnce(user) // email lookup succeeds
        .mockResolvedValueOnce(null); // phone lookup not needed

      const result = await userService.getUserByEmailOrPhone('test@example.com');

      expect(result).toEqual(user);
    });

    it('should return user if found by phone', async () => {
      const user = UserTestFactory.createUser({ phoneNumber: '1234567890' });

      (mockPrisma.user.findUnique as any)
        .mockResolvedValueOnce(null) // email lookup fails
        .mockResolvedValueOnce(user); // phone lookup succeeds

      const result = await userService.getUserByEmailOrPhone('1234567890');

      expect(result).toEqual(user);
    });

    it('should return null if not found by either', async () => {
      MockPrismaClient.mockUserFindUnique(mockPrisma, null);

      const result = await userService.getUserByEmailOrPhone('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser = UserTestFactory.createUser({ email: 'old@example.com' });
      const updatedUser = UserTestFactory.createUser({ email: 'new@example.com' });

      (mockPrisma.user.findUnique as any)
        .mockResolvedValueOnce(existingUser) // getUserById
        .mockResolvedValueOnce(null); // email doesn't exist

      MockPrismaClient.mockUserUpdate(mockPrisma, updatedUser);

      const result = await userService.updateUser(existingUser.id, { email: 'new@example.com' });

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: { email: 'new@example.com' },
      });
    });

    it('should throw NotFoundError if user does not exist', async () => {
      MockPrismaClient.mockUserFindUnique(mockPrisma, null);

      await expect(userService.updateUser('non-existent-id', { email: 'new@example.com' })).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError if removing both email and phone', async () => {
      const existingUser = UserTestFactory.createUser({ email: 'test@example.com', phoneNumber: '1234567890' });
      MockPrismaClient.mockUserFindUnique(mockPrisma, existingUser);

      await expect(
        userService.updateUser(existingUser.id, { email: null as any, phoneNumber: null as any })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if new email already exists', async () => {
      const existingUser = UserTestFactory.createUser({ id: 'user-1', email: 'old@example.com' });
      const conflictUser = UserTestFactory.createUser({ id: 'user-2', email: 'new@example.com' });

      (mockPrisma.user.findUnique as any)
        .mockResolvedValueOnce(existingUser) // getUserById
        .mockResolvedValueOnce(conflictUser); // email exists check

      await expect(userService.updateUser(existingUser.id, { email: 'new@example.com' })).rejects.toThrow(
        ConflictError
      );
    });

    it('should throw ConflictError if new phone already exists', async () => {
      const existingUser = UserTestFactory.createUser({ id: 'user-1', phoneNumber: '1111111111' });
      const conflictUser = UserTestFactory.createUser({ id: 'user-2', phoneNumber: '2222222222' });

      (mockPrisma.user.findUnique as any)
        .mockResolvedValueOnce(existingUser) // getUserById
        .mockResolvedValueOnce(conflictUser); // phone exists check

      await expect(userService.updateUser(existingUser.id, { phoneNumber: '2222222222' })).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      MockPrismaClient.mockUserDelete(mockPrisma);

      await userService.deleteUser('user-id');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users ordered by creation date', async () => {
      const users = UserTestFactory.createUsers(3);
      MockPrismaClient.mockUserFindMany(mockPrisma, users);

      const result = await userService.getAllUsers();

      expect(result).toEqual(users);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });

    it('should return empty array if no users exist', async () => {
      MockPrismaClient.mockUserFindMany(mockPrisma, []);

      const result = await userService.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      const user = UserTestFactory.createUser({ email: 'test@example.com' });
      MockPrismaClient.mockUserFindUnique(mockPrisma, user);

      const result = await userService.emailExists('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      MockPrismaClient.mockUserFindUnique(mockPrisma, null);

      const result = await userService.emailExists('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('phoneExists', () => {
    it('should return true if phone exists', async () => {
      const user = UserTestFactory.createUser({ phoneNumber: '1234567890' });
      MockPrismaClient.mockUserFindUnique(mockPrisma, user);

      const result = await userService.phoneExists('1234567890');

      expect(result).toBe(true);
    });

    it('should return false if phone does not exist', async () => {
      MockPrismaClient.mockUserFindUnique(mockPrisma, null);

      const result = await userService.phoneExists('9999999999');

      expect(result).toBe(false);
    });
  });
});
