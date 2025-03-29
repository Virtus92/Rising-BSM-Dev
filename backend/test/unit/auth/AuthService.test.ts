import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { AuthService } from '../../../src/services/AuthService.js';
import { IUserRepository } from '../../../src/interfaces/IUserRepository.js';
import { IRefreshTokenRepository } from '../../../src/interfaces/IRefreshTokenRepository.js';
import { ILoggingService } from '../../../src/interfaces/ILoggingService.js';
import { IValidationService } from '../../../src/interfaces/IValidationService.js';
import { IErrorHandler } from '../../../src/interfaces/IErrorHandler.js';
import { User, UserStatus } from '../../../src/entities/User.js';
import { RefreshToken } from '../../../src/entities/RefreshToken.js';
import { 
  LoginDto, 
  RefreshTokenDto, 
  ForgotPasswordDto,
  ResetPasswordDto
} from '../../../src/dtos/AuthDtos.js';
import { CryptoHelper } from '../../../src/utils/crypto-helper.js';
import config from '../../../src/config/index.js';

// Mock dependencies
const mockUserRepository = mock<IUserRepository>();
const mockRefreshTokenRepository = mock<IRefreshTokenRepository>();
const mockLogger = mock<ILoggingService>();
const mockValidator = mock<IValidationService>();
const mockErrorHandler = mock<IErrorHandler>();

// Mock JWT generation
jest.mock('../../../src/utils/crypto-helper.js', () => {
  const original = jest.requireActual('../../../src/utils/crypto-helper.js');
  return {
    ...original,
    CryptoHelper: {
      ...original.CryptoHelper,
      generateJwtToken: jest.fn().mockReturnValue('test-jwt-token'),
      generateRandomToken: jest.fn().mockReturnValue('test-refresh-token'),
      hashToken: jest.fn().mockImplementation((token) => `hashed-${token}`),
      calculateExpirationDate: jest.fn().mockImplementation(() => new Date(Date.now() + 24 * 60 * 60 * 1000)), // 1 day
      verifyPassword: jest.fn().mockImplementation((plain, hashed) => {
        // Simple mock implementation for testing - not for real use
        return Promise.resolve(plain === 'correct-password' || hashed.includes(plain));
      }),
      hashPassword: jest.fn().mockImplementation((password) => {
        return Promise.resolve(`hashed-${password}`);
      })
    }
  };
});

// Test constants
const TEST_USER_ID = 1;
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';
const TEST_HASHED_PASSWORD = 'hashed-Password123!';
const TEST_REFRESH_TOKEN = 'test-refresh-token';
const TEST_RESET_TOKEN = 'test-reset-token';

// Service under test
let authService: AuthService;

describe('AuthService Unit Tests', () => {
  // Set up before each test
  beforeEach(() => {
    // Reset all mocks
    mockReset(mockUserRepository);
    mockReset(mockRefreshTokenRepository);
    mockReset(mockLogger);
    mockReset(mockValidator);
    mockReset(mockErrorHandler);
    
    // Create the service with mock dependencies
    authService = new AuthService(
      mockUserRepository,
      mockRefreshTokenRepository,
      mockLogger,
      mockValidator,
      mockErrorHandler
    );
    
    // Default error handler behavior
    mockErrorHandler.createUnauthorizedError.mockImplementation(message => {
      const error = new Error(message) as any;
      error.statusCode = 401;
      return error;
    });
    
    mockErrorHandler.createNotFoundError.mockImplementation(message => {
      const error = new Error(message) as any;
      error.statusCode = 404;
      return error;
    });
    
    mockErrorHandler.createValidationError.mockImplementation((message, errors) => {
      const error = new Error(message) as any;
      error.statusCode = 400;
      error.errors = errors;
      return error;
    });
  });
  
  describe('login', () => {
    // Create a properly mocked User object
    const createMockUser = (overrides = {}) => {
      return {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        password: TEST_HASHED_PASSWORD,
        status: UserStatus.ACTIVE,
        role: 'mitarbeiter',
        firstName: 'Test',
        lastName: 'User',
        phone: null,
        profilePicture: null,
        getFullName: jest.fn().mockReturnValue('Test User'),
        getNameParts: jest.fn().mockReturnValue({ firstName: 'Test', lastName: 'User' }),
        recordLogin: jest.fn(),
        setPassword: jest.fn(),
        isActive: jest.fn().mockReturnValue(true),
        toJSON: jest.fn(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
      } as unknown as User;
    };
    
    // Create a properly mocked RefreshToken object
    const createMockRefreshToken = (overrides = {}) => {
      return {
        token: TEST_REFRESH_TOKEN,
        userId: TEST_USER_ID,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        createdByIp: '127.0.0.1',
        isRevoked: false,
        revokedAt: null,
        revokedByIp: null,
        replacedByToken: null,
        isActive: jest.fn().mockReturnValue(true),
        isExpired: jest.fn().mockReturnValue(false),
        revoke: jest.fn(),
        ...overrides
      } as unknown as RefreshToken;
    };
    
    it('should successfully log in a user with valid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: TEST_EMAIL,
        password: 'correct-password'
      };
      
      const mockUser = createMockUser();
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);
      mockUserRepository.logActivity.mockResolvedValue({ id: 1 } as any);
      mockRefreshTokenRepository.create.mockResolvedValue({
        token: TEST_REFRESH_TOKEN
      } as any);
      
      // Act
      const result = await authService.login(loginDto);
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(TEST_EMAIL);
      expect(mockUser.recordLogin).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled();
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id', TEST_USER_ID);
      expect(result.user).toHaveProperty('email', TEST_EMAIL);
    });
    
    it('should reject login with non-existent user', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: TEST_PASSWORD
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.login(loginDto))
        .rejects
        .toThrow('Invalid email or password');
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).not.toHaveBeenCalled();
    });
    
    it('should reject login for inactive user', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      };
      
      const inactiveUser = createMockUser({
        status: UserStatus.INACTIVE
      });
      
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);
      
      // Act & Assert
      await expect(authService.login(loginDto))
        .rejects
        .toThrow('Your account is not active');
        
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(TEST_EMAIL);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).not.toHaveBeenCalled();
    });
    
    it('should reject login with incorrect password', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: TEST_EMAIL,
        password: 'wrong-password'
      };
      
      const mockUser = createMockUser();
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      // Mock password verification to fail
      (CryptoHelper.verifyPassword as jest.Mock).mockResolvedValueOnce(false);
      
      // Act & Assert
      await expect(authService.login(loginDto))
        .rejects
        .toThrow('Invalid email or password');
        
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(TEST_EMAIL);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('refreshToken', () => {
    // Create a properly mocked User object
    const createMockUser = (overrides = {}) => {
      return {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: UserStatus.ACTIVE,
        role: 'mitarbeiter',
        firstName: 'Test',
        lastName: 'User',
        phone: null,
        profilePicture: null,
        getFullName: jest.fn().mockReturnValue('Test User'),
        getNameParts: jest.fn().mockReturnValue({ firstName: 'Test', lastName: 'User' }),
        recordLogin: jest.fn(),
        setPassword: jest.fn(),
        isActive: jest.fn().mockReturnValue(true),
        toJSON: jest.fn(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
      } as unknown as User;
    };
    
    // Create a properly mocked RefreshToken object
    const createMockRefreshToken = (overrides = {}) => {
      return {
        token: TEST_REFRESH_TOKEN,
        userId: TEST_USER_ID,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        createdByIp: '127.0.0.1',
        isRevoked: false,
        revokedAt: null,
        revokedByIp: null,
        replacedByToken: null,
        isActive: jest.fn().mockReturnValue(true),
        isExpired: jest.fn().mockReturnValue(false),
        revoke: jest.fn(),
        ...overrides
      } as unknown as RefreshToken;
    };
    
    it('should successfully refresh token with valid refresh token', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: TEST_REFRESH_TOKEN
      };
      
      const mockUser = createMockUser();
      const mockToken = createMockRefreshToken();
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(mockToken);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRefreshTokenRepository.update.mockResolvedValue(mockToken);
      mockRefreshTokenRepository.create.mockResolvedValue({
        token: 'new-refresh-token'
      } as any);
      mockUserRepository.logActivity.mockResolvedValue({ id: 1 } as any);
      
      // Enable token rotation
      config.JWT_REFRESH_TOKEN_ROTATION = true;
      
      // Act
      const result = await authService.refreshToken(refreshTokenDto);
      
      // Assert
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(TEST_REFRESH_TOKEN);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(TEST_USER_ID);
      expect(mockToken.revoke).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.update).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });
    
    it('should reject refresh with invalid token', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid-token'
      };
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.refreshToken(refreshTokenDto))
        .rejects
        .toThrow('Invalid refresh token');
        
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith('invalid-token');
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled();
    });
    
    it('should reject refresh with expired token', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: TEST_REFRESH_TOKEN
      };
      
      const expiredToken = createMockRefreshToken({
        isActive: jest.fn().mockReturnValue(false)
      });
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(expiredToken);
      
      // Act & Assert
      await expect(authService.refreshToken(refreshTokenDto))
        .rejects
        .toThrow('Refresh token has expired or been revoked');
        
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(TEST_REFRESH_TOKEN);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled();
    });
    
    it('should reject refresh if user not found', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: TEST_REFRESH_TOKEN
      };
      
      const mockToken = createMockRefreshToken();
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(mockToken);
      mockUserRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.refreshToken(refreshTokenDto))
        .rejects
        .toThrow('User not found');
        
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(TEST_REFRESH_TOKEN);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(TEST_USER_ID);
      expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled();
    });
    
    it('should reject refresh if user is inactive', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: TEST_REFRESH_TOKEN
      };
      
      const inactiveUser = createMockUser({
        status: UserStatus.INACTIVE
      });
      
      const mockToken = createMockRefreshToken();
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(mockToken);
      mockUserRepository.findById.mockResolvedValue(inactiveUser);
      
      // Act & Assert
      await expect(authService.refreshToken(refreshTokenDto))
        .rejects
        .toThrow('User account is inactive');
        
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(TEST_REFRESH_TOKEN);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(TEST_USER_ID);
      expect(mockToken.revoke).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.update).toHaveBeenCalled();
    });
  });
  
  describe('forgotPassword', () => {
    // Create a properly mocked User object
    const createMockUser = (overrides = {}) => {
      return {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: UserStatus.ACTIVE,
        role: 'mitarbeiter',
        firstName: 'Test',
        lastName: 'User',
        phone: null,
        profilePicture: null,
        getFullName: jest.fn().mockReturnValue('Test User'),
        getNameParts: jest.fn().mockReturnValue({ firstName: 'Test', lastName: 'User' }),
        recordLogin: jest.fn(),
        setPassword: jest.fn(),
        isActive: jest.fn().mockReturnValue(true),
        toJSON: jest.fn(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
      } as unknown as User;
    };
    
    it('should process forgot password request for existing user', async () => {
      // Arrange
      const forgotPasswordDto: ForgotPasswordDto = {
        email: TEST_EMAIL
      };
      
      const mockUser = createMockUser();
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);
      mockUserRepository.logActivity.mockResolvedValue({ id: 1 } as any);
      
      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(TEST_EMAIL);
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
      
      expect(result).toHaveProperty('success', true);
    });
    
    it('should return success for non-existent user (prevent email enumeration)', async () => {
      // Arrange
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com'
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockUserRepository.logActivity).not.toHaveBeenCalled();
      
      expect(result).toHaveProperty('success', true);
    });
    
    it('should return success for inactive user (prevent email enumeration)', async () => {
      // Arrange
      const forgotPasswordDto: ForgotPasswordDto = {
        email: TEST_EMAIL
      };
      
      const inactiveUser = createMockUser({
        status: UserStatus.INACTIVE
      });
      
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);
      
      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(TEST_EMAIL);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockUserRepository.logActivity).not.toHaveBeenCalled();
      
      expect(result).toHaveProperty('success', true);
    });
  });
  
  describe('resetPassword', () => {
    // Create a properly mocked User object
    const createMockUser = (overrides = {}) => {
      return {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        resetToken: `hashed-${TEST_RESET_TOKEN}`,
        resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours in future
        status: UserStatus.ACTIVE,
        role: 'mitarbeiter',
        firstName: 'Test',
        lastName: 'User',
        phone: null,
        profilePicture: null,
        getFullName: jest.fn().mockReturnValue('Test User'),
        getNameParts: jest.fn().mockReturnValue({ firstName: 'Test', lastName: 'User' }),
        recordLogin: jest.fn(),
        setPassword: jest.fn(),
        isActive: jest.fn().mockReturnValue(true),
        toJSON: jest.fn(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
      } as unknown as User;
    };
    
    it('should reset password with valid token', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        token: TEST_RESET_TOKEN,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      mockValidator.validate.mockReturnValue({
        isValid: true,
        errors: [],
        validatedData: resetPasswordDto
      });
      
      const mockUser = createMockUser();
      
      mockUserRepository.findOneByCriteria.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);
      mockUserRepository.logActivity.mockResolvedValue({ id: 1 } as any);
      mockRefreshTokenRepository.deleteAllForUser.mockResolvedValue(1);
      
      // Act
      const result = await authService.resetPassword(resetPasswordDto);
      
      // Assert
      expect(mockValidator.validate).toHaveBeenCalled();
      expect(mockUserRepository.findOneByCriteria).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.deleteAllForUser).toHaveBeenCalledWith(TEST_USER_ID);
      
      expect(result).toHaveProperty('success', true);
    });
    
    it('should reject reset with validation errors', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        token: TEST_RESET_TOKEN,
        password: 'short',
        confirmPassword: 'short'
      };
      
      mockValidator.validate.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
        validatedData: resetPasswordDto
      });
      
      // Act & Assert
      await expect(authService.resetPassword(resetPasswordDto))
        .rejects
        .toThrow('Validation failed');
        
      expect(mockValidator.validate).toHaveBeenCalled();
      expect(mockUserRepository.findOneByCriteria).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
    
    it('should reject reset with invalid token', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        token: 'invalid-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      mockValidator.validate.mockReturnValue({
        isValid: true,
        errors: [],
        validatedData: resetPasswordDto
      });
      
      mockUserRepository.findOneByCriteria.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.resetPassword(resetPasswordDto))
        .rejects
        .toThrow('Invalid or expired reset token');
        
      expect(mockValidator.validate).toHaveBeenCalled();
      expect(mockUserRepository.findOneByCriteria).toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
    
    it('should reject reset with expired token', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        token: TEST_RESET_TOKEN,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      
      mockValidator.validate.mockReturnValue({
        isValid: true,
        errors: [],
        validatedData: resetPasswordDto
      });
      
      const expiredUser = createMockUser({
        resetTokenExpiry: new Date(Date.now() - 1000) // Expired token
      });
      
      mockUserRepository.findOneByCriteria.mockResolvedValue(expiredUser);
      
      // Act & Assert
      await expect(authService.resetPassword(resetPasswordDto))
        .rejects
        .toThrow('Reset token has expired');
        
      expect(mockValidator.validate).toHaveBeenCalled();
      expect(mockUserRepository.findOneByCriteria).toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('logout', () => {
    // Create a properly mocked RefreshToken object
    const createMockRefreshToken = (overrides = {}) => {
      return {
        token: TEST_REFRESH_TOKEN,
        userId: TEST_USER_ID,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        createdByIp: '127.0.0.1',
        isRevoked: false,
        revokedAt: null,
        revokedByIp: null,
        replacedByToken: null,
        isActive: jest.fn().mockReturnValue(true),
        isExpired: jest.fn().mockReturnValue(false),
        revoke: jest.fn(),
        ...overrides
      } as unknown as RefreshToken;
    };
    
    it('should logout user with specific token', async () => {
      // Arrange
      const mockToken = createMockRefreshToken();
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(mockToken);
      mockRefreshTokenRepository.update.mockResolvedValue(mockToken);
      
      // Act
      const result = await authService.logout(TEST_USER_ID, TEST_REFRESH_TOKEN);
      
      // Assert
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(TEST_REFRESH_TOKEN);
      expect(mockToken.revoke).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.update).toHaveBeenCalled();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('tokenCount', 1);
    });
    
    it('should handle token not found', async () => {
      // Arrange
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);
      
      // Act
      const result = await authService.logout(TEST_USER_ID, 'non-existent-token');
      
      // Assert
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith('non-existent-token');
      expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('tokenCount', 0);
    });
    
    it('should handle token userId mismatch', async () => {
      // Arrange
      const differentUserToken = createMockRefreshToken({
        userId: TEST_USER_ID + 1 // Different user ID
      });
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(differentUserToken);
      
      // Act
      const result = await authService.logout(TEST_USER_ID, TEST_REFRESH_TOKEN);
      
      // Assert
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(TEST_REFRESH_TOKEN);
      expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('tokenCount', 0);
    });
    
    it('should logout all tokens for user when no specific token provided', async () => {
      // Arrange
      const tokens = [
        createMockRefreshToken(),
        createMockRefreshToken({ token: 'token2' }),
        createMockRefreshToken({ 
          token: 'token3', 
          isActive: jest.fn().mockReturnValue(false) 
        })
      ];
      
      mockRefreshTokenRepository.findByUserId.mockResolvedValue(tokens);
      mockRefreshTokenRepository.update.mockResolvedValue({} as any);
      
      // Act
      const result = await authService.logout(TEST_USER_ID);
      
      // Assert
      expect(mockRefreshTokenRepository.findByUserId).toHaveBeenCalledWith(TEST_USER_ID);
      
      // Only active tokens should be revoked
      expect(tokens[0].revoke).toHaveBeenCalled();
      expect(tokens[1].revoke).toHaveBeenCalled();
      expect(tokens[2].revoke).not.toHaveBeenCalled();
      
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledTimes(2);
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('tokenCount', 2);
    });
  });
});