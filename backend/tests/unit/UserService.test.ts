/**
 * Unit Tests for UserService
 */
import { jest, expect, describe, it, beforeEach } from '@jest/globals';
import { UserService } from '../../src/services/UserService.js';
import { User, UserStatus } from '../../src/entities/User.js';
import { 
  createMockLoggingService, 
  createMockErrorHandler, 
  createMockValidationService, 
  createMockUserRepository 
} from '../utils/mock-helper.js';
import { CryptoHelper } from '../../src/utils/crypto-helper.js';

// Create mocks using our utility functions
const mockUserRepository = createMockUserRepository();
const mockLogger = createMockLoggingService();
const mockValidator = createMockValidationService();
const mockErrorHandler = createMockErrorHandler();

// Create test instance
const userService = new UserService(
  mockUserRepository,
  mockLogger,
  mockValidator,
  mockErrorHandler
);

// Test data
const testUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'employee',
  status: UserStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  getFullName: () => 'Test User',
  recordLogin: jest.fn()
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(true);
  jest.spyOn(CryptoHelper, 'hashPassword').mockResolvedValue('hashed_password');
});

describe('UserService', () => {
  describe('findByEmail', () => {
    it('should return user when found', async () => {
      // Arrange
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      
      // Act
      const result = await userService.findByEmail('test@example.com');
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });
    
    it('should return null when user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Act
      const result = await userService.findByEmail('nonexistent@example.com');
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });
    
    it('should handle repository errors', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockUserRepository.findByEmail.mockRejectedValue(mockError);
      mockErrorHandler.createError.mockReturnValue(new Error('Handled database error'));
      
      // Act & Assert
      await expect(userService.findByEmail('error@example.com')).rejects.toThrow('Handled database error');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('error@example.com');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe('authenticate', () => {
    it('should return user when credentials are valid', async () => {
      // Arrange
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      mockUserRepository.update.mockResolvedValue(userEntity);
      
      // Act
      const result = await userService.authenticate('test@example.com', 'password');
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith('password', 'hashedpassword');
      expect(mockUserRepository.update).toHaveBeenCalled();
    });
    
    it('should return null when user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Act
      const result = await userService.authenticate('nonexistent@example.com', 'password');
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });
    
    it('should return null when user status is not active', async () => {
      // Arrange
      const inactiveUser = { ...testUser, status: UserStatus.INACTIVE };
      const userEntity = new User();
      Object.assign(userEntity, inactiveUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      
      // Act
      const result = await userService.authenticate('inactive@example.com', 'password');
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('inactive@example.com');
      expect(result).toBeNull();
    });
    
    it('should return null when password is invalid', async () => {
      // Arrange
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      
      // Override verify password mock to return false
      jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(false);
      
      // Act
      const result = await userService.authenticate('test@example.com', 'wrong_password');
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith('wrong_password', 'hashedpassword');
      expect(result).toBeNull();
    });
  });
  
  describe('findUsers', () => {
    it('should return paginated users', async () => {
      // Arrange
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      mockUserRepository.findUsers.mockResolvedValue({
        data: [userEntity],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      });
      
      // Act
      const result = await userService.findUsers({
        page: 1,
        limit: 10
      });
      
      // Assert
      expect(mockUserRepository.findUsers).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });
    });
  });
  
  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      // Arrange
      const createData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'NewPassword123!',
        role: 'employee'
      };
      
      const userEntity = new User();
      Object.assign(userEntity, { id: 2, ...createData, password: 'hashed_password', createdAt: new Date(), updatedAt: new Date() });
      
      mockValidator.validate.mockReturnValue({ isValid: true, errors: [], validatedData: createData });
      mockUserRepository.create.mockResolvedValue(userEntity);
      mockUserRepository.logActivity.mockResolvedValue({});
      
      // Act
      const result = await userService.create(createData);
      
      // Assert
      expect(mockValidator.validate).toHaveBeenCalled();
      expect(CryptoHelper.hashPassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New User',
        email: 'new@example.com',
        password: 'hashed_password'
      }));
      expect(result).toBeDefined();
      expect(result.email).toBe('new@example.com');
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
    });
    
    it('should validate input data before creating', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        password: 'short'
      };
      
      mockValidator.validate.mockReturnValue({ isValid: false, errors: ['Invalid email', 'Password too short'], validatedData: {} });
      mockErrorHandler.createValidationError.mockReturnValue(new Error('Validation failed'));
      
      // Act & Assert
      await expect(userService.create(invalidData)).rejects.toThrow('Validation failed');
      expect(mockValidator.validate).toHaveBeenCalledWith(invalidData, expect.anything(), expect.anything());
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      // Arrange
      const userId = 1;
      const changePasswordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      mockUserRepository.findById.mockResolvedValue(userEntity);
      mockUserRepository.updatePassword.mockResolvedValue(userEntity);
      mockUserRepository.logActivity.mockResolvedValue({});
      mockValidator.validate.mockReturnValue({ isValid: true, errors: [], validatedData: changePasswordData });
      
      // Act
      const result = await userService.changePassword(userId, changePasswordData);
      
      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith('OldPassword123!', 'hashedpassword');
      expect(CryptoHelper.hashPassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(userId, 'hashed_password');
      expect(result).toBe(true);
    });
    
    it('should throw error when current password is incorrect', async () => {
      // Arrange
      const userId = 1;
      const changePasswordData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      mockUserRepository.findById.mockResolvedValue(userEntity);
      mockValidator.validate.mockReturnValue({ isValid: true, errors: [], validatedData: changePasswordData });
      
      // Override verify password mock to return false
      jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(false);
      
      mockErrorHandler.createValidationError.mockReturnValue(new Error('Password change failed'));
      
      // Act & Assert
      await expect(userService.changePassword(userId, changePasswordData)).rejects.toThrow('Password change failed');
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });
});
