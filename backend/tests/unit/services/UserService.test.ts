import { UserService } from '../../../src/services/UserService.js';
import { User, UserStatus } from '../../../src/entities/User.js';
import { mock, mockReset } from 'jest-mock-extended';
import { IUserRepository } from '../../../src/interfaces/IUserRepository.js';
import { ILoggingService } from '../../../src/interfaces/ILoggingService.js';
import { IValidationService } from '../../../src/interfaces/IValidationService.js';
import { IErrorHandler, AppError } from '../../../src/interfaces/IErrorHandler.js';
import { testUser, testAdmin } from '../../fixtures/users.js';
import { CryptoHelper } from '../../../src/utils/crypto-helper.js';

// Create mocks
const mockUserRepository = mock<IUserRepository>();
const mockLogger = mock<ILoggingService>();
const mockValidator = mock<IValidationService>();
const mockErrorHandler = mock<IErrorHandler>();

// Create test instance
let userService: UserService;

beforeEach(() => {
  // Reset all mocks
  mockReset(mockUserRepository);
  mockReset(mockLogger);
  mockReset(mockValidator);
  mockReset(mockErrorHandler);
  
  // Mock validation to always succeed by default
  mockValidator.validate.mockReturnValue({ 
    isValid: true, 
    errors: [], 
    validatedData: {} 
  });
  
  // Create a fresh service instance for each test
  userService = new UserService(
    mockUserRepository,
    mockLogger,
    mockValidator,
    mockErrorHandler
  );
});

describe('UserService', () => {
  describe('findByEmail', () => {
    it('should return user when found', async () => {
      // Arrange
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      
      // Act
      const result = await userService.findByEmail('test-user@example.com');
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test-user@example.com');
      expect(result).toBeDefined();
      expect(result?.email).toBe('test-user@example.com');
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
    
    it('should handle errors and log them', async () => {
      // Arrange
      const testError = new Error('Database error');
      mockUserRepository.findByEmail.mockRejectedValue(testError);
      mockErrorHandler.createError.mockReturnValue(
        new AppError('Database operation failed', 500)
      );
      
      // Act & Assert
      await expect(userService.findByEmail('test@example.com'))
        .rejects.toThrow('Database operation failed');
      
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockErrorHandler.createError).toHaveBeenCalled();
    });
  });
  
  describe('authenticate', () => {
    it('should return user when credentials are valid', async () => {
      // Arrange
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      
      // Set up CryptoHelper mock
      jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(true);
      mockUserRepository.update.mockResolvedValue(userEntity);
      
      // Act
      const result = await userService.authenticate('test-user@example.com', 'TestPassword123!');
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe('test-user@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test-user@example.com');
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith('TestPassword123!', testUser.password);
      // Should update lastLoginAt
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
    
    it('should return null when password is invalid', async () => {
      // Arrange
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      
      // Set up CryptoHelper mock to return false for invalid password
      jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(false);
      
      // Act
      const result = await userService.authenticate('test-user@example.com', 'WrongPassword123!');
      
      // Assert
      expect(result).toBeNull();
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith('WrongPassword123!', testUser.password);
      // Should not update lastLoginAt
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
    
    it('should return null when user is inactive', async () => {
      // Arrange
      const inactiveUserEntity = new User();
      Object.assign(inactiveUserEntity, { ...testUser, status: UserStatus.INACTIVE });
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUserEntity);
      
      // Act
      const result = await userService.authenticate('test-user@example.com', 'TestPassword123!');
      
      // Assert
      expect(result).toBeNull();
      // Should not call verifyPassword for inactive users
      expect(CryptoHelper.verifyPassword).not.toHaveBeenCalled();
    });
  });
  
  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const createUserDto = {
        name: 'New User',
        email: 'new-user@example.com',
        password: 'NewPassword123!',
        role: 'employee'
      };
      
      const userEntity = new User();
      Object.assign(userEntity, { 
        id: 999, 
        ...createUserDto, 
        password: 'hashed_NewPassword123!',
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Mock hash password
      jest.spyOn(CryptoHelper, 'hashPassword').mockResolvedValue('hashed_NewPassword123!');
      
      mockUserRepository.create.mockResolvedValue(userEntity);
      mockValidator.validate.mockReturnValue({ 
        isValid: true, 
        errors: [], 
        validatedData: createUserDto 
      });
      
      // Act
      const result = await userService.create(createUserDto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(999);
      expect(result.email).toBe('new-user@example.com');
      expect(mockValidator.validate).toHaveBeenCalled();
      expect(CryptoHelper.hashPassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
    });
    
    it('should throw error when validation fails', async () => {
      // Arrange
      const createUserDto = {
        name: 'New User',
        email: 'invalid-email',
        password: 'weak'
      };
      
      const validationError = {
        isValid: false,
        errors: ['Email is invalid', 'Password is too weak'],
        validatedData: {}
      };
      
      mockValidator.validate.mockReturnValue(validationError);
      mockErrorHandler.createValidationError.mockReturnValue(
        new AppError('Validation failed', 400, 'validation_error', { errors: validationError.errors })
      );
      
      // Act & Assert
      await expect(userService.create(createUserDto))
        .rejects.toThrow('Validation failed');
      
      expect(mockValidator.validate).toHaveBeenCalled();
      expect(mockErrorHandler.createValidationError).toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('update', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const userId = 1;
      const updateUserDto = {
        name: 'Updated User',
        phone: '+49 111 222 333'
      };
      
      const existingUser = new User();
      Object.assign(existingUser, testUser);
      
      const updatedUserEntity = new User();
      Object.assign(updatedUserEntity, { 
        ...testUser,
        ...updateUserDto,
        updatedAt: new Date()
      });
      
      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUserEntity);
      
      // Act
      const result = await userService.update(userId, updateUserDto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Updated User');
      expect(result.phone).toBe('+49 111 222 333');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
    });
    
    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 999;
      const updateUserDto = {
        name: 'Updated User'
      };
      
      mockUserRepository.findById.mockResolvedValue(null);
      mockErrorHandler.createNotFoundError.mockReturnValue(
        new AppError('User with ID 999 not found', 404, 'not_found')
      );
      
      // Act & Assert
      await expect(userService.update(userId, updateUserDto))
        .rejects.toThrow('User with ID 999 not found');
      
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserDetails', () => {
    it('should return detailed user information', async () => {
      // Arrange
      const userId = 1;
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      const userActivities = [
        { id: 1, userId: 1, activity: 'login', timestamp: new Date() },
        { id: 2, userId: 1, activity: 'profile_update', timestamp: new Date() }
      ];
      
      mockUserRepository.findById.mockResolvedValue(userEntity);
      mockUserRepository.getUserActivity.mockResolvedValue(userActivities);
      
      // Act
      const result = await userService.getUserDetails(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
      expect(result?.activities).toBeDefined();
      expect(result?.activities).toHaveLength(2);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.getUserActivity).toHaveBeenCalledWith(userId, 10);
    });
    
    it('should return null when user not found', async () => {
      // Arrange
      const userId = 999;
      mockUserRepository.findById.mockResolvedValue(null);
      
      // Act
      const result = await userService.getUserDetails(userId);
      
      // Assert
      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.getUserActivity).not.toHaveBeenCalled();
    });
  });
  
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userId = 1;
      const passwordData = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      const userEntity = new User();
      Object.assign(userEntity, { 
        ...testUser,
        password: 'hashed_CurrentPassword123!'
      });
      
      mockUserRepository.findById.mockResolvedValue(userEntity);
      mockValidator.validate.mockReturnValue({ 
        isValid: true, 
        errors: [], 
        validatedData: passwordData 
      });
      
      // Set up CryptoHelper mocks
      jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(true);
      jest.spyOn(CryptoHelper, 'hashPassword').mockResolvedValue('hashed_NewPassword123!');
      
      mockUserRepository.updatePassword.mockResolvedValue(userEntity);
      
      // Act
      const result = await userService.changePassword(userId, passwordData);
      
      // Assert
      expect(result).toBe(true);
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith(
        'CurrentPassword123!', 
        'hashed_CurrentPassword123!'
      );
      expect(CryptoHelper.hashPassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(userId, 'hashed_NewPassword123!');
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
    });
    
    it('should throw error when current password is incorrect', async () => {
      // Arrange
      const userId = 1;
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      const userEntity = new User();
      Object.assign(userEntity, { 
        ...testUser,
        password: 'hashed_CurrentPassword123!'
      });
      
      mockUserRepository.findById.mockResolvedValue(userEntity);
      mockValidator.validate.mockReturnValue({ 
        isValid: true, 
        errors: [], 
        validatedData: passwordData 
      });
      
      // Set up CryptoHelper mock to return false for wrong password
      jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(false);
      
      mockErrorHandler.createValidationError.mockReturnValue(
        new AppError('Password change failed', 400, 'validation_error', { 
          errors: ['Current password is incorrect'] 
        })
      );
      
      // Act & Assert
      await expect(userService.changePassword(userId, passwordData))
        .rejects.toThrow('Password change failed');
      
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith(
        'WrongPassword123!', 
        'hashed_CurrentPassword123!'
      );
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });
});
