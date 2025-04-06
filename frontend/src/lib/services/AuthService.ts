import { IAuthService } from '../interfaces/IAuthService.js';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler, UnauthorizedError } from '../interfaces/IErrorHandler.js';
import { 
  LoginDto, 
  AuthResponseDto, 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto
} from '../dtos/AuthDtos.js';
import { ServiceOptions } from '../interfaces/IBaseService.js';
import { RefreshToken } from '../entities/RefreshToken.js';
import { User, UserStatus } from '../entities/User.js';
import { CryptoHelper } from '../utils/crypto-helper.js';
import config from '../config/index.js';

/**
 * AuthService
 * 
 * Service implementation for authentication-related operations.
 * Handles user login, token management, password reset, etc.
 */
export class AuthService implements IAuthService {
  /**
   * Creates a new AuthService instance
   * 
   * @param userRepository - User repository
   * @param refreshTokenRepository - Refresh token repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly logger: ILoggingService,
    private readonly validator: IValidationService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized AuthService');
  }
  /**
   * Generates a password reset token for testing purposes
   * This method should NOT be used in production environments
   * 
   * @param email - The email of the user to generate a reset token for
   * @returns The raw reset token and its expiry date
   */
  async getResetTokenForTesting(email: string): Promise<{ token: string; expiry: Date }> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This method cannot be used in production environments');
    }
    
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw this.errorHandler.createNotFoundError(`User with email ${email} not found`);
    }

    // Generate reset token
    const resetToken = CryptoHelper.generateRandomToken();
    const hashedToken = CryptoHelper.hashToken(resetToken);
    const tokenExpiry = CryptoHelper.calculateExpirationDate('24h');
    
    // Store reset token in database
    await this.userRepository.update(user.id, {
      resetToken: hashedToken,
      resetTokenExpiry: tokenExpiry
    });

    this.logger.debug(`Generated test reset token for ${email}`);
    
    // Return the raw token for testing purposes
    return { token: resetToken, expiry: tokenExpiry };
  }

  /**
   * Login a user with email and password
   * 
   * @param loginDto - Login data
   * @param options - Service options
   * @returns Authentication response with tokens and user data
   */
  async login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(loginDto.email);

      if (!user) {
        throw this.errorHandler.createUnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw this.errorHandler.createUnauthorizedError('Your account is not active');
      }

      // Verify password
      const isPasswordValid = await CryptoHelper.verifyPassword(loginDto.password, user.password || '');
      if (!isPasswordValid) {
        throw this.errorHandler.createUnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user, options?.context?.ipAddress);

      // Update last login timestamp
      user.recordLogin();
      await this.userRepository.update(user.id, { lastLoginAt: new Date() });

      // Log user activity
      await this.userRepository.logActivity(
        user.id,
        'login',
        'User logged in',
        options?.context?.ipAddress
      );

      // Return authentication response
      return {
        id: user.id,
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiryTime(config.JWT_EXPIRES_IN),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.getFullName(),
          email: user.email,
          role: user.role,
          status: user.status,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Login failed', error instanceof Error ? error : String(error), {
        email: loginDto.email
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   * 
   * @param refreshTokenDto - Refresh token data
   * @param options - Service options
   * @returns Refresh token response with new tokens
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto, options?: ServiceOptions): Promise<RefreshTokenResponseDto> {
    try {
      // Validate refresh token
      const token = await this.refreshTokenRepository.findByToken(refreshTokenDto.refreshToken);
      
      if (!token) {
        throw this.errorHandler.createUnauthorizedError('Invalid refresh token');
      }

      if (!token.isActive()) {
        throw this.errorHandler.createUnauthorizedError('Refresh token has expired or been revoked');
      }

      // Get user from DB
      const user = await this.userRepository.findById(token.userId);
      
      if (!user) {
        throw this.errorHandler.createUnauthorizedError('User not found');
      }

      if (user.status !== UserStatus.ACTIVE) {
        // Revoke refresh token if user is no longer active
        token.revoke(options?.context?.ipAddress);
        await this.refreshTokenRepository.update(token.token, { 
          isRevoked: true,
          revokedAt: new Date(),
          revokedByIp: options?.context?.ipAddress
        });
        
        throw this.errorHandler.createUnauthorizedError('User account is inactive');
      }

      // Generate new tokens
      let newToken;
      
      if (config.JWT_REFRESH_TOKEN_ROTATION) {
        // If token rotation is enabled, create a new refresh token
        const tokenPair = await this.generateTokens(user, options?.context?.ipAddress);
        
        // Revoke old token and replace it with the new one
        token.revoke(options?.context?.ipAddress, tokenPair.refreshToken);
        await this.refreshTokenRepository.update(token.token, {
          isRevoked: true,
          revokedAt: new Date(),
          revokedByIp: options?.context?.ipAddress,
          replacedByToken: tokenPair.refreshToken
        });
        
        newToken = {
          id: user.id,
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: this.getTokenExpiryTime(config.JWT_EXPIRES_IN),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        // If token rotation is disabled, just generate a new access token
        const accessToken = this.generateAccessToken(user);
        
        newToken = {
          id: user.id,
          accessToken,
          refreshToken: token.token, // Return the same refresh token
          expiresIn: this.getTokenExpiryTime(config.JWT_EXPIRES_IN),
          createdAt: token.createdAt.toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Log user activity
      await this.userRepository.logActivity(
        user.id,
        'token_refresh',
        'User refreshed access token',
        options?.context?.ipAddress
      );

      return newToken;
    } catch (error) {
      this.logger.error('Token refresh failed', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Handle forgot password request
   * 
   * @param forgotPasswordDto - Forgot password data
   * @param options - Service options
   * @returns Success indicator
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(forgotPasswordDto.email);
      
      // If no user found, still return success to prevent email enumeration
      if (!user) {
        this.logger.info(`Forgot password requested for non-existent email: ${forgotPasswordDto.email}`);
        return { success: true };
      }

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.info(`Forgot password requested for inactive account: ${forgotPasswordDto.email}`);
        return { success: true };
      }

      // Generate reset token
      const resetToken = CryptoHelper.generateRandomToken();
      const hashedToken = CryptoHelper.hashToken(resetToken);
      const tokenExpiry = CryptoHelper.calculateExpirationDate('24h');
      
      // Store reset token in database
      await this.userRepository.update(user.id, {
        resetToken: hashedToken,
        resetTokenExpiry: tokenExpiry
      });
      
      // Log activity
      await this.userRepository.logActivity(
        user.id,
        'password_reset_request',
        'User requested password reset',
        options?.context?.ipAddress
      );

      // In a real implementation, send an email with the reset link
      // For development, we'll just log the token
      this.logger.info(`Password reset token for ${user.email}: ${resetToken}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Forgot password failed', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Validate reset token
   * 
   * @param token - Reset token
   * @returns Whether token is valid
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = CryptoHelper.hashToken(token);
      
      // Find user with this reset token
      const user = await this.userRepository.findOneByCriteria({ resetToken: hashedToken });
      
      if (!user) {
        return false;
      }
      
      // Check if token is expired
      if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error('Reset token validation failed', error instanceof Error ? error : String(error));
      return false;
    }
  }

  /**
   * Reset password
   * 
   * @param resetPasswordDto - Reset password data
   * @param options - Service options
   * @returns Success indicator
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      // Validate password format
      const { isValid, errors } = this.validator.validate(resetPasswordDto, {
        password: {
          type: 'string',
          required: true,
          min: 8,
          messages: {
            required: 'Password is required',
            min: 'Password must be at least 8 characters long'
          }
        },
        confirmPassword: {
          type: 'string',
          required: true,
          validate: (value: string, data: any) => {
            return value === data.password || 'Passwords do not match';
          },
          messages: {
            required: 'Confirm password is required'
          }
        },
        token: {
          type: 'string',
          required: true,
          messages: {
            required: 'Reset token is required'
          }
        }
      });

      if (!isValid) {
        throw this.errorHandler.createValidationError('Validation failed', errors);
      }

      // Verify the token
      const hashedToken = CryptoHelper.hashToken(resetPasswordDto.token || '');
      
      // Find user with this reset token
      const user = await this.userRepository.findOneByCriteria({ resetToken: hashedToken });
      
      if (!user) {
        throw this.errorHandler.createUnauthorizedError('Invalid or expired reset token');
      }
      
      // Check if token is expired
      if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        throw this.errorHandler.createUnauthorizedError('Reset token has expired');
      }

      // Hash the new password
      const hashedPassword = await CryptoHelper.hashPassword(resetPasswordDto.password);
      
      // Update user's password and clear reset token
      await this.userRepository.update(user.id, {
        password: hashedPassword,
        resetToken: undefined,
        resetTokenExpiry: undefined
      });
      
      // Log activity
      await this.userRepository.logActivity(
        user.id,
        'password_reset',
        'User reset password',
        options?.context?.ipAddress
      );

      // Invalidate all refresh tokens for the user
      await this.refreshTokenRepository.deleteAllForUser(user.id);

      return { success: true };
    } catch (error) {
      this.logger.error('Reset password failed', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Logout a user
   * 
   * @param userId - User ID
   * @param refreshToken - Refresh token to invalidate (optional)
   * @param options - Service options
   * @returns Logout result
   */
  async logout(userId: number, refreshToken?: string, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }> {
    try {
      let tokenCount = 0;
      
      // Log debugging information
      this.logger.debug('Processing logout', { 
        userId, 
        hasRefreshToken: !!refreshToken,
        ipAddress: options?.context?.ipAddress
      });
      
      // If a specific refresh token is provided, invalidate only that token
      if (refreshToken) {
        this.logger.debug('Looking up refresh token', { tokenSubstring: refreshToken.substring(0, 10) + '...' });
        
        const token = await this.refreshTokenRepository.findByToken(refreshToken);
        
        if (token) {
          this.logger.debug('Found token', { 
            tokenId: token.token.substring(0, 10) + '...',
            tokenUserId: token.userId,
            requestUserId: userId,
            isActive: token.isActive()
          });
          
          if (token.userId === userId) {
            token.revoke(options?.context?.ipAddress);
            await this.refreshTokenRepository.update(token.token, {
              isRevoked: true,
              revokedAt: new Date(),
              revokedByIp: options?.context?.ipAddress
            });
            tokenCount = 1;
            this.logger.debug('Successfully revoked token');
          } else {
            this.logger.warn('Token user ID mismatch', { tokenUserId: token.userId, requestUserId: userId });
          }
        } else {
          this.logger.warn('Refresh token not found in database');
        }
      } else {
        // If no token provided, invalidate all refresh tokens for the user
        this.logger.debug('No specific token provided, invalidating all tokens for user', { userId });
        
        const tokens = await this.refreshTokenRepository.findByUserId(userId);
        this.logger.debug('Found tokens for user', { count: tokens.length });
        
        for (const token of tokens) {
          if (token.isActive()) {
            token.revoke(options?.context?.ipAddress);
            await this.refreshTokenRepository.update(token.token, {
              isRevoked: true,
              revokedAt: new Date(),
              revokedByIp: options?.context?.ipAddress
            });
            tokenCount++;
          }
        }
        
        this.logger.debug('Revoked tokens', { count: tokenCount });
      }
      
      return { success: true, tokenCount };
    } catch (error) {
      this.logger.error('Logout failed', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens for a user
   * 
   * @param user - User entity
   * @param ipAddress - IP address of the requester
   * @returns Token pair
   */
  private async generateTokens(user: User, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(user);
    
    // Generate a refresh token
    const refreshToken = CryptoHelper.generateRandomToken();
    
    // Calculate expiration date
    const expiresAt = CryptoHelper.calculateExpirationDate(config.JWT_REFRESH_EXPIRES_IN);
    
    // Save refresh token in database
    const refreshTokenEntity: Partial<RefreshToken> = {
      token: refreshToken,
      userId: user.id,
      expiresAt,
      createdAt: new Date(),
      createdByIp: ipAddress,
      isRevoked: false
    };
    
    await this.refreshTokenRepository.create(refreshTokenEntity);
    
    return { accessToken, refreshToken };
  }

  /**
   * Generate an access token for a user
   * 
   * @param user - User entity
   * @returns Access token string
   */
  private generateAccessToken(user: User): string {
    // Create token payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };
    
    // Sign the token using CryptoHelper
    return CryptoHelper.generateJwtToken(payload, { 
      expiresIn: config.JWT_EXPIRES_IN
    });
  }

  /**
   * Convert token expiry time string to milliseconds
   * 
   * @param expiryString - Expiry time string (e.g., '15m', '7d')
   * @returns Time in milliseconds
   */
  private getTokenExpiryTime(expiryString: string): number {
    const unit = expiryString.charAt(expiryString.length - 1);
    const value = parseInt(expiryString.substring(0, expiryString.length - 1), 10);
    
    switch(unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000; // Default to 15 minutes
    }
  }
}