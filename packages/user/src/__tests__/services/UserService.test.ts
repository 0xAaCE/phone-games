import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../../services/userService.js';
import { ValidationError, ConflictError, NotFoundError } from '@phone-games/errors';
import { UserTestFactory } from '../factories/userFactory.js';
import { MockUserRepository } from '@phone-games/repositories/src/__tests__/mocks/mockUserRepository.js';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockUserRepository.clear();
    userService = new UserService(mockUserRepository);
  });

  describe('createUser', () => {
    it('should create a user with email', async () => {
      const { phoneNumber: _phoneNumber, ...userData } = UserTestFactory.createUserData({ email: 'test@example.com' });

      const result = await userService.createUser(userData);

      expect(result.id).toBe(userData.id);
      expect(result.email).toBe(userData.email);
      expect(result.username).toBe(userData.username);
    });

    it('should create a user with phone number', async () => {
      const { email: _email, ...userData } = UserTestFactory.createUserData({ phoneNumber: '1234567890' });

      const result = await userService.createUser(userData);

      expect(result.phoneNumber).toBe(userData.phoneNumber);
      expect(result.username).toBe(userData.username);
    });

    it('should create a user with both email and phone', async () => {
      const userData = UserTestFactory.createUserData();

      const result = await userService.createUser(userData);

      expect(result.email).toBe(userData.email);
      expect(result.phoneNumber).toBe(userData.phoneNumber);
    });

    it('should throw ValidationError if neither email nor phone provided', async () => {
      const { email: _email, phoneNumber: _phoneNumber, ...userData } = UserTestFactory.createUserData();

      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError);
      await expect(userService.createUser(userData)).rejects.toThrow(
        'Either email or phone number must be provided'
      );
    });

    it('should throw ConflictError if email already exists', async () => {
      const existingUserData = UserTestFactory.createUserData({ email: 'existing@example.com' });
      await userService.createUser(existingUserData);

      const userData = UserTestFactory.createUserData({ email: 'existing@example.com' });

      await expect(userService.createUser(userData)).rejects.toThrow(ConflictError);
      await expect(userService.createUser(userData)).rejects.toThrow('Email already exists');
    });

    it('should throw ConflictError if phone already exists', async () => {
      const existingUserData = UserTestFactory.createUserData({ phoneNumber: '1234567890' });
      await userService.createUser(existingUserData);

      const { email: _email, ...userData } = UserTestFactory.createUserData({ phoneNumber: '1234567890' });

      await expect(userService.createUser(userData)).rejects.toThrow(ConflictError);
      await expect(userService.createUser(userData)).rejects.toThrow('Phone number already exists');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const userData = UserTestFactory.createUserData();
      await userService.createUser(userData);

      const result = await userService.getUserById(userData.id);

      expect(result?.id).toBe(userData.id);
    });

    it('should return null if user not found', async () => {
      const result = await userService.getUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found by email', async () => {
      const userData = UserTestFactory.createUserData({ email: 'test@example.com' });
      await userService.createUser(userData);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserByPhone', () => {
    it('should return user if found by phone', async () => {
      const userData = UserTestFactory.createUserData({ phoneNumber: '1234567890' });
      await userService.createUser(userData);

      const result = await userService.getUserByPhone('1234567890');

      expect(result?.phoneNumber).toBe('1234567890');
    });

    it('should return null if user not found', async () => {
      const result = await userService.getUserByPhone('9999999999');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user if found by username', async () => {
      const userData = UserTestFactory.createUserData({ username: 'testuser' });
      await userService.createUser(userData);

      const result = await userService.getUserByUsername('testuser');

      expect(result?.username).toBe('testuser');
    });

    it('should return null if user not found', async () => {
      const result = await userService.getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmailOrPhone', () => {
    it('should return user if found by email', async () => {
      const userData = UserTestFactory.createUserData({ email: 'test@example.com' });
      await userService.createUser(userData);

      const result = await userService.getUserByEmailOrPhone('test@example.com');

      expect(result?.email).toBe('test@example.com');
    });

    it('should return user if found by phone', async () => {
      const userData = UserTestFactory.createUserData({ phoneNumber: '1234567890' });
      await userService.createUser(userData);

      const result = await userService.getUserByEmailOrPhone('1234567890');

      expect(result?.phoneNumber).toBe('1234567890');
    });

    it('should return null if not found by either', async () => {
      const result = await userService.getUserByEmailOrPhone('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userData = UserTestFactory.createUserData({ email: 'old@example.com' });
      await userService.createUser(userData);

      const result = await userService.updateUser(userData.id, { email: 'new@example.com' });

      expect(result.email).toBe('new@example.com');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      await expect(userService.updateUser('non-existent-id', { email: 'new@example.com' })).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError if removing both email and phone', async () => {
      const userData = UserTestFactory.createUserData({ email: 'test@example.com', phoneNumber: '1234567890' });
      await userService.createUser(userData);

      await expect(
        userService.updateUser(userData.id, { email: null as any, phoneNumber: null as any })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if new email already exists', async () => {
      const user1Data = UserTestFactory.createUserData({ id: 'user-1', email: 'old@example.com', phoneNumber: '1111111111' });
      const user2Data = UserTestFactory.createUserData({ id: 'user-2', email: 'new@example.com', phoneNumber: '2222222222' });
      await userService.createUser(user1Data);
      await userService.createUser(user2Data);

      await expect(userService.updateUser(user1Data.id, { email: 'new@example.com' })).rejects.toThrow(
        ConflictError
      );
    });

    it('should throw ConflictError if new phone already exists', async () => {
      const user1Data = UserTestFactory.createUserData({ id: 'user-1', email: 'user1@example.com', phoneNumber: '1111111111' });
      const user2Data = UserTestFactory.createUserData({ id: 'user-2', email: 'user2@example.com', phoneNumber: '2222222222' });
      await userService.createUser(user1Data);
      await userService.createUser(user2Data);

      await expect(userService.updateUser(user1Data.id, { phoneNumber: '2222222222' })).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userData = UserTestFactory.createUserData();
      await userService.createUser(userData);

      await userService.deleteUser(userData.id);

      const result = await userService.getUserById(userData.id);
      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users ordered by creation date', async () => {
      const user1Data = UserTestFactory.createUserData({ id: 'user-1', email: 'user1@example.com', phoneNumber: '1111111111' });
      const user2Data = UserTestFactory.createUserData({ id: 'user-2', email: 'user2@example.com', phoneNumber: '2222222222' });
      const user3Data = UserTestFactory.createUserData({ id: 'user-3', email: 'user3@example.com', phoneNumber: '3333333333' });

      await userService.createUser(user1Data);
      await userService.createUser(user2Data);
      await userService.createUser(user3Data);

      const result = await userService.getAllUsers();

      expect(result.length).toBe(3);
    });

    it('should return empty array if no users exist', async () => {
      const result = await userService.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      const userData = UserTestFactory.createUserData({ email: 'test@example.com' });
      await userService.createUser(userData);

      const result = await userService.emailExists('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const result = await userService.emailExists('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('phoneExists', () => {
    it('should return true if phone exists', async () => {
      const userData = UserTestFactory.createUserData({ phoneNumber: '1234567890' });
      await userService.createUser(userData);

      const result = await userService.phoneExists('1234567890');

      expect(result).toBe(true);
    });

    it('should return false if phone does not exist', async () => {
      const result = await userService.phoneExists('9999999999');

      expect(result).toBe(false);
    });
  });
});
