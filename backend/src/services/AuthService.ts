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
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * AuthService
 * 
 * Service implementation for authentication-related operations.
 * Handles user login, token management, password reset, etc.
 */
export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_REFRESH_EXPIRES_IN: string;
  private readonly JWT_REFRESH_TOKEN_ROTATION: boolean;

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

    // Load configuration from environment variables
    this.JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.JWT_REFRESH_TOKEN_ROTATION = process.env.JWT_REFRESH_TOKEN_ROTATION === 'true';
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
      const isPasswordValid = await this.verifyPassword(loginDto.password, user.password || '');
      if (!isPasswordValid) {
        throw this.errorHandler.createUnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user, options?.ipAddress);

      // Update last login timestamp
      user.recordLogin();
      await this.userRepository.update(user.id, { lastLoginAt: new Date() });

      // Log user activity
      await this.userRepository.logActivity(
        user.id,
        'login',
        'User logged in',
        options?.ipAddress
      );

      // Return authentication response
      return {
        id: user.id,
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiryTime(this.JWT_EXPIRES_IN),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.getFullName(),
          email: user.email,
          role: user.role,
          status: user.status,
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
        token.revoke(options?.ipAddress);
        await this.refreshTokenRepository.update(token.token, { 
          isRevoked: true,
          revokedAt: new Date(),
          revokedByIp: options?.ipAddress
        });
        
        throw this.errorHandler.createUnauthorizedError('User account is inactive');
      }

      // Generate new tokens
      let newToken;
      
      if (this.JWT_REFRESH_TOKEN_ROTATION) {
        // If token rotation is enabled, create a new refresh token
        const tokenPair = await this.generateTokens(user, options?.ipAddress);
        
        // Revoke old token and replace it with the new one
        token.revoke(options?.ipAddress, tokenPair.refreshToken);
        await this.refreshTokenRepository.update(token.token, {
          isRevoked: true,
          revokedAt: new Date(),
          revokedByIp: options?.ipAddress,
          replacedByToken: tokenPair.refreshToken
        });
        
        newToken = {
          id: user.id,
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: this.getTokenExpiryTime(this.JWT_EXPIRES_IN),
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
          expiresIn: this.getTokenExpiryTime(this.JWT_EXPIRES_IN),
          createdAt: token.createdAt.toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Log user activity
      await this.userRepository.logActivity(
        user.id,
        'token_refresh',
        'User refreshed access token',
        options?.ipAddress
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
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = this.hashResetToken(resetToken);
      
      // Store reset token in database (this would typically be in a password_resets table)
      // For this example, we'll assume the schema and implementation
      
      // Log activity
      await this.userRepository.logActivity(
        user.id,
        'password_reset_request',
        'User requested password reset',
        options?.ipAddress
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
      // In a real implementation, verify the token against stored hash
      // For this example, we'll simulate a validation
      const hashedToken = this.hashResetToken(token);
      
      // Check if token exists and is not expired
      // This would be a database check in a real implementation
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
        }
      });

      if (!isValid) {
        throw this.errorHandler.createValidationError('Validation failed', errors);
      }

      // Verify the token
      if (!resetPasswordDto.token) {
        throw this.errorHandler.createUnauthorizedError('Reset token is required');
      }
      
      const isValidToken = await this.validateResetToken(resetPasswordDto.token);
      
      if (!isValidToken) {
        throw this.errorHandler.createUnauthorizedError('Invalid or expired reset token');
      }

      // Find the user associated with the token
      // This would be a database lookup in a real implementation
      // For this example, we'll assume it returns a valid user
      const userId = 1; // Example user ID
      
      // Get the user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }

      // Hash the new password
      const hashedPassword = await this.hashPassword(resetPasswordDto.password);
      
      // Update user's password
      await this.userRepository.updatePassword(user.id, hashedPassword);
      
      // Invalidate the reset token
      // This would be a database operation in a real implementation
      
      // Log activity
      await this.userRepository.logActivity(
        user.id,
        'password_reset',
        'User reset password',
        options?.ipAddress
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
        ipAddress: options?.ipAddress
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
            token.revoke(options?.ipAddress);
            await this.refreshTokenRepository.update(token.token, {
              isRevoked: true,
              revokedAt: new Date(),
              revokedByIp: options?.ipAddress
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
            token.revoke(options?.ipAddress);
            await this.refreshTokenRepository.update(token.token, {
              isRevoked: true,
              revokedAt: new Date(),
              revokedByIp: options?.ipAddress
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
  private async generateTokens(user: any, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(user);
    
    // Generate a refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Save refresh token in database
    const refreshTokenEntity = {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + this.getTokenExpiryTime(this.JWT_REFRESH_EXPIRES_IN)),
      createdByIp: ipAddress
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
  private generateAccessToken(user: any): string {
    // Create token payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };
    
    // Sign the token
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions);
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

  /**
   * Verify user password
   * 
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password
   * @returns Whether password is valid
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hash password
   * 
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Hash reset token
   * 
   * @param token - Reset token
   * @returns Hashed token
   */
  private hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get reset token for testing (required by IAuthService)
   * 
   * @param email - User email
   * @returns Reset token data
   */
  async getResetTokenForTesting(email: string): Promise<any> {
    // This is for testing purposes only and should not be used in production
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw this.errorHandler.createNotFoundError('User not found');
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashResetToken(resetToken);
    
    // In a real implementation, this would store the token in the database
    
    return {
      token: resetToken,
      hashedToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    };
  }
}