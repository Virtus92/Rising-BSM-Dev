import { AuthService } from '../../../src/services/AuthService.js';
import { IUserRepository } from '../../../src/interfaces/IUserRepository.js';
import { IRefreshTokenRepository } from '../../../src/interfaces/IRefreshTokenRepository.js';
import { ILoggingService } from '../../../src/interfaces/ILoggingService.js';
import { IValidationService } from '../../../src/interfaces/IValidationService.js';
import { IErrorHandler, AppError, UnauthorizedError } from '../../../src/interfaces/IErrorHandler.js';
import { mock, mockReset } from 'jest-mock-extended';
import { User, UserStatus } from '../../../src/entities/User.js';
import { RefreshToken } from '../../../src/entities/RefreshToken.js';
import { CryptoHelper } from '../../../src/utils/crypto-helper.js';
import { testUser } from '../../fixtures/users.js';
import { 
  validLoginCredentials, 
  refreshTokenData, 
  expiredRefreshToken, 
  revokedRefreshToken,
  passwordResetData,
  resetPasswordData,
  invalidResetPasswordData
} from '../../fixtures/auth.js';

// Create mocks
const mockUserRepository = mock<IUserRepository>();
const mockRefreshTokenRepository = mock<IRefreshTokenRepository>();
const mockLogger = mock<ILoggingService>();
const mockValidator = mock<IValidationService>();
const mockErrorHandler = mock<IErrorHandler>();

// Create test instance
let authService: AuthService;

// Set up environment variables
const originalEnv = process.env;

beforeEach(() => {
  // Reset all mocks
  mockReset(mockUserRepository);
  mockReset(mockRefreshTokenRepository);
  mockReset(mockLogger);
  mockReset(mockValidator);
  mockReset(mockErrorHandler);
  
  // Reset JWT environment variables
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.JWT_REFRESH_TOKEN_ROTATION = 'true';
  
  // Mock validation to always succeed by default
  mockValidator.validate.mockReturnValue({ 
    isValid: true, 
    errors: [], 
    validatedData: {} 
  });
  
  // Set up CryptoHelper mocks
  jest.spyOn(CryptoHelper, 'generateJwtToken').mockReturnValue('mock-jwt-token');
  jest.spyOn(CryptoHelper, 'generateRandomToken').mockReturnValue('mock-refresh-token');
  jest.spyOn(CryptoHelper, 'hashToken').mockImplementation((token) => `hashed_${token}`);
  jest.spyOn(CryptoHelper, 'calculateExpirationDate').mockImplementation(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });
  
  // Create a fresh service instance for each test
  authService = new AuthService(
    mockUserRepository,
    mockRefreshTokenRepository,
    mockLogger,
    mockValidator,
    mockErrorHandler
  );
});

afterEach(() => {
  // Restore environment variables
  process.env = originalEnv;
});

describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens and user data when login is successful', async () => {
      // Arrange
      const loginDto = validLoginCredentials;
      
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      const refreshTokenEntity = new RefreshToken();
      Object.assign(refreshTokenEntity, refreshTokenData);
      
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(true);
      mockRefreshTokenRepository.create.mockResolvedValue(refreshTokenEntity);
      mockUserRepository.update.mockResolvedValue(userEntity);
      
      // Act
      const result = await authService.login(loginDto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.id).toBe(testUser.id);
      expect(result.user.email).toBe(testUser.email);
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith(loginDto.password, testUser.password);
      expect(CryptoHelper.generateJwtToken).toHaveBeenCalled();
      expect(CryptoHelper.generateRandomToken).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalled(); // For lastLoginAt update
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
    });
    
    it('should throw error when user not found', async () => {
      // Arrange
      const loginDto = validLoginCredentials;
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockErrorHandler.createUnauthorizedError.mockReturnValue(
        new UnauthorizedError('Invalid email or password')
      );
      
      // Act & Assert
      await expect(authService.login(loginDto))
        .rejects.toThrow('Invalid email or password');
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(CryptoHelper.verifyPassword).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).not.toHaveBeenCalled();
    });
    
    it('should throw error when user is inactive', async () => {
      // Arrange
      const loginDto = validLoginCredentials;
      
      const inactiveUserEntity = new User();
      Object.assign(inactiveUserEntity, { ...testUser, status: UserStatus.INACTIVE });
      
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUserEntity);
      mockErrorHandler.createUnauthorizedError.mockReturnValue(
        new UnauthorizedError('Your account is not active')
      );
      
      // Act & Assert
      await expect(authService.login(loginDto))
        .rejects.toThrow('Your account is not active');
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(CryptoHelper.verifyPassword).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).not.toHaveBeenCalled();
    });
    
    it('should throw error when password is incorrect', async () => {
      // Arrange
      const loginDto = validLoginCredentials;
      
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      jest.spyOn(CryptoHelper, 'verifyPassword').mockResolvedValue(false);
      mockErrorHandler.createUnauthorizedError.mockReturnValue(
        new UnauthorizedError('Invalid email or password')
      );
      
      // Act & Assert
      await expect(authService.login(loginDto))
        .rejects.toThrow('Invalid email or password');
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(CryptoHelper.verifyPassword).toHaveBeenCalledWith(loginDto.password, testUser.password);
      expect(mockRefreshTokenRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh token successfully with token rotation enabled', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
      
      const refreshTokenEntity = new RefreshToken();
      Object.assign(refreshTokenEntity, refreshTokenData);
      
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(refreshTokenEntity);
      mockUserRepository.findById.mockResolvedValue(userEntity);
      mockRefreshTokenRepository.update.mockResolvedValue(refreshTokenEntity);
      
      // Act
      const result = await authService.refreshToken(refreshTokenDto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(refreshTokenEntity.userId);
      expect(CryptoHelper.generateJwtToken).toHaveBeenCalled();
      expect(CryptoHelper.generateRandomToken).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.update).toHaveBeenCalled();
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
    });
    
    it('should throw error when refresh token not found', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'invalid-token' };
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);
      mockErrorHandler.createUnauthorizedError.mockReturnValue(
        new UnauthorizedError('Invalid refresh token')
      );
      
      // Act & Assert
      await expect(authService.refreshToken(refreshTokenDto))
        .rejects.toThrow('Invalid refresh token');
      
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
    
    it('should throw error when refresh token is expired', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'expired-token' };
      
      const expiredTokenEntity = new RefreshToken();
      Object.assign(expiredTokenEntity, expiredRefreshToken);
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(expiredTokenEntity);
      mockErrorHandler.createUnauthorizedError.mockReturnValue(
        new UnauthorizedError('Refresh token has expired or been revoked')
      );
      
      // Act & Assert
      await expect(authService.refreshToken(refreshTokenDto))
        .rejects.toThrow('Refresh token has expired or been revoked');
      
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
    
    it('should throw error when user not found', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
      
      const refreshTokenEntity = new RefreshToken();
      Object.assign(refreshTokenEntity, refreshTokenData);
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(refreshTokenEntity);
      mockUserRepository.findById.mockResolvedValue(null);
      mockErrorHandler.createUnauthorizedError.mockReturnValue(
        new UnauthorizedError('User not found')
      );
      
      // Act & Assert
      await expect(authService.refreshToken(refreshTokenDto))
        .rejects.toThrow('User not found');
      
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(refreshTokenEntity.userId);
    });
  });
  
  describe('forgotPassword', () => {
    it('should generate reset token when email exists', async () => {
      // Arrange
      const forgotPasswordDto = passwordResetData;
      
      const userEntity = new User();
      Object.assign(userEntity, testUser);
      
      mockUserRepository.findByEmail.mockResolvedValue(userEntity);
      mockUserRepository.update.mockResolvedValue(userEntity);
      
      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(forgotPasswordDto.email);
      expect(CryptoHelper.generateRandomToken).toHaveBeenCalled();
      expect(CryptoHelper.hashToken).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
    });
    
    it('should not reveal email existence but return success for non-existent email', async () => {
      // Arrange
      const forgotPasswordDto = { email: 'nonexistent@example.com' };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(forgotPasswordDto.email);
      expect(CryptoHelper.generateRandomToken).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('resetPassword', () => {
    it('should reset password when token is valid', async () => {
      // Arrange
      const resetPasswordDto = resetPasswordData;
      
      const userEntity = new User();
      Object.assign(userEntity, { 
        ...testUser, 
        resetToken: 'hashed_valid-reset-token',
        resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day in future
      });
      
      mockValidator.validate.mockReturnValue({ 
        isValid: true, 
        errors: [], 
        validatedData: resetPasswordDto 
      });
      mockUserRepository.findOneByCriteria.mockResolvedValue(userEntity);
      jest.spyOn(CryptoHelper, 'hashPassword').mockResolvedValue('hashed_NewPassword123!');
      mockUserRepository.update.mockResolvedValue(userEntity);
      mockRefreshTokenRepository.deleteAllForUser.mockResolvedValue(0);
      
      // Act
      const result = await authService.resetPassword(resetPasswordDto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      expect(mockValidator.validate).toHaveBeenCalled();
      expect(mockUserRepository.findOneByCriteria).toHaveBeenCalledWith({ 
        resetToken: 'hashed_valid-reset-token' 
      });
      expect(CryptoHelper.hashPassword).toHaveBeenCalledWith('NewPassword123!');
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.deleteAllForUser).toHaveBeenCalledWith(testUser.id);
      expect(mockUserRepository.logActivity).toHaveBeenCalled();
    });
    
    it('should throw error when reset token is invalid', async () => {
      // Arrange
      const resetPasswordDto = resetPasswordData;
      
      mockValidator.validate.mockReturnValue({ 
        isValid: true, 
        errors: [], 
        validatedData: resetPasswordDto 
      });
      mockUserRepository.findOneByCriteria.mockResolvedValue(null);
      mockErrorHandler.createUnauthorizedError.mockReturnValue(
        new UnauthorizedError('Invalid or expired reset token')
      );
      
      // Act & Assert
      await expect(authService.resetPassword(resetPasswordDto))
        .rejects.toThrow('Invalid or expired reset token');
      
      expect(mockUserRepository.findOneByCriteria).toHaveBeenCalledWith({ 
        resetToken: 'hashed_valid-reset-token' 
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
    
    it('should throw error when reset token is expired', async () => {
      // Arrange
      const resetPasswordDto = resetPasswordData;
      
      const userEntity = new User();
      Object.assign(userEntity, { 
        ...testUser, 
        resetToken: 'hashed_valid-reset-token',
        resetTokenExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day in past
      });
      
      mockValidator.validate.mockReturnValue({ 
        isValid: true, 
        errors: [], 
        validatedData: resetPasswordDto 
      });
      mockUserRepository.findOneByCriteria.mockResolvedValue(userEntity);
      mockErrorHandler.createUnauthorizedError.mockReturnValue(
        new UnauthorizedError('Reset token has expired')
      );
      
      // Act & Assert
      await expect(authService.resetPassword(resetPasswordDto))
        .rejects.toThrow('Reset token has expired');
      
      expect(mockUserRepository.findOneByCriteria).toHaveBeenCalledWith({ 
        resetToken: 'hashed_valid-reset-token' 
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('logout', () => {
    it('should invalidate specific refresh token if provided', async () => {
      // Arrange
      const userId = 1;
      const refreshToken = 'valid-refresh-token';
      
      const refreshTokenEntity = new RefreshToken();
      Object.assign(refreshTokenEntity, { 
        ...refreshTokenData, 
        userId: userId 
      });
      
      mockRefreshTokenRepository.findByToken.mockResolvedValue(refreshTokenEntity);
      mockRefreshTokenRepository.update.mockResolvedValue(refreshTokenEntity);
      
      // Act
      const result = await authService.logout(userId, refreshToken);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.tokenCount).toBe(1);
      
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(refreshToken);
      expect(mockRefreshTokenRepository.update).toHaveBeenCalled();
    });
    
    it('should invalidate all user refresh tokens if no specific token provided', async () => {
      // Arrange
      const userId = 1;
      
      const refreshTokenEntity1 = new RefreshToken();
      Object.assign(refreshTokenEntity1, { 
        ...refreshTokenData, 
        token: 'token-1',
        userId: userId 
      });
      
      const refreshTokenEntity2 = new RefreshToken();
      Object.assign(refreshTokenEntity2, { 
        ...refreshTokenData, 
        token: 'token-2',
        userId: userId 
      });
      
      mockRefreshTokenRepository.findByUserId.mockResolvedValue([
        refreshTokenEntity1,
        refreshTokenEntity2
      ]);
      mockRefreshTokenRepository.update.mockResolvedValue(refreshTokenEntity1);
      
      // Act
      const result = await authService.logout(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.tokenCount).toBe(2);
      
      expect(mockRefreshTokenRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledTimes(2);
    });
  });
});
