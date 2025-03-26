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
      
      // If a specific refresh token is provided, invalidate only that token
      if (refreshToken) {
        const token = await this.refreshTokenRepository.findByToken(refreshToken);
        
        if (token && token.userId === userId) {
          token.revoke(options?.ipAddress);
          await this.refreshTokenRepository.update(token.token, {
            isRevoked: true,
            revokedAt: new Date(),
            revokedByIp: options?.ipAddress
          });
          tokenCount = 1;
        }
      } else {
        // If no token provided, invalidate all refresh tokens for the user
        const tokens = await this.refreshTokenRepository.findByUserId(userId);
        
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
      }

      // Log user activity
      await this.userRepository.logActivity(
        userId,
        'logout',
        'User logged out',
        options?.ipAddress
      );

      return { success: true, tokenCount };
    } catch (error) {
      this.logger.error('Logout failed', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get reset token for testing (development only)
   * 
   * @param email - User email
   * @returns Reset token information
   */
  async getResetTokenForTesting(email: string): Promise<any> {
    if (process.env.NODE_ENV !== 'development') {
      throw this.errorHandler.createForbiddenError('This endpoint is only available in development mode');
    }

    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError('No user found with this email');
      }

      // In a real implementation, get the token from the database
      // For this example, we'll generate a new one
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      return {
        email: user.email,
        userId: user.id,
        resetToken,
        resetUrl: `/reset-password?token=${resetToken}`
      };
    } catch (error) {
      this.logger.error('Get reset token for testing failed', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   * 
   * @param user - User entity
   * @param ipAddress - IP address of the client
   * @returns Token pair
   */
  private async generateTokens(user: User, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Generate access token
    const accessToken = this.generateAccessToken(user);
    
    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Calculate expiry date
    const expiryDate = this.calculateExpiryDate(this.JWT_REFRESH_EXPIRES_IN);
    
    // Save refresh token in database
    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: expiryDate,
      createdAt: new Date(),
      createdByIp: ipAddress,
      isRevoked: false
    });
    
    return { accessToken, refreshToken };
  }

  /**
   * Generate JWT access token
   * 
   * @param user - User entity
   * @returns JWT token
   */
  private generateAccessToken(user: User): string {
    const payload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.getFullName()
    };
    
    // Fixed type signature for jwt.sign
    return jwt.sign(
      payload, 
      this.JWT_SECRET as jwt.Secret, 
      { expiresIn: this.JWT_EXPIRES_IN  } as jwt.SignOptions
    );
  }

  /**
   * Verify password against hash
   * 
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns Whether password is valid
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Hash password
   * 
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Hash reset token
   * 
   * @param token - Reset token
   * @returns Hashed token
   */
  private hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token || '').digest('hex');
  }

  /**
   * Calculate expiry date from duration string
   * 
   * @param duration - Duration string (e.g., '7d', '1h')
   * @returns Expiry date
   */
  private calculateExpiryDate(duration: string): Date {
    const now = new Date();
    const unit = duration.charAt(duration.length - 1);
    const value = parseInt(duration.slice(0, -1));
    
    switch (unit) {
      case 's': // seconds
        return new Date(now.getTime() + value * 1000);
      case 'm': // minutes
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h': // hours
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd': // days
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // default to 1 day
    }
  }

  /**
   * Get token expiry time in seconds
   * 
   * @param duration - Duration string
   * @returns Expiry time in seconds
   */
  private getTokenExpiryTime(duration: string): number {
    const unit = duration.charAt(duration.length - 1);
    const value = parseInt(duration.slice(0, -1));
    
    switch (unit) {
      case 's': // seconds
        return value;
      case 'm': // minutes
        return value * 60;
      case 'h': // hours
        return value * 60 * 60;
      case 'd': // days
        return value * 24 * 60 * 60;
      default:
        return 60 * 15; // default to 15 minutes
    }
  }
}