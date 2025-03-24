import { format } from 'date-fns';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '../utils/base.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { NotFoundError, ValidationError, ConflictError } from '../../backup/utils_bak/errors.js';
import { 
  LoginDTO, 
  ForgotPasswordDTO, 
  ResetPasswordDTO, 
  RefreshTokenDTO,
  LogoutDTO
} from '../types/dtos/auth.dto.js';
import config from '../config/index.js';
import { options } from 'pdfkit';

/**
 * Service for authentication operations
 */
export class AuthService extends BaseService<any, any, any, any, any, any> {
  constructor() {
    super(userRepository);
  }

  /**
   * Authenticate user
   * @param loginData - User login data containing email and password
   * @param options - Additional options for authentication
   * @returns Authenticated user data with tokens
   */
  async authenticate(loginData: LoginDTO, options: { ipAddress: string }): Promise<any> {
    try {
      // Validate input
      if (!loginData.email || !loginData.password) {
        throw new ValidationError('Email and password are required');
      }
      
      // Get user from repository
      const user = await this.repository.findByEmail(loginData.email);
      
      // Check if user exists
      if (!user) {
        throw new NotFoundError('Invalid credentials');
      }
      
      // Check if user is active
      if (user.status !== 'aktiv') {
        throw new ValidationError('Account is inactive or suspended');
      }
      
      // Check if password is correct
      const passwordIsValid = await bcrypt.compare(loginData.password, user.password);
      if (!passwordIsValid) {
        throw new NotFoundError('Invalid credentials');
      }
      
      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user, options.ipAddress);
      
      // Log login activity
      await this.repository.logActivity(
        user.id,
        user.id,
        user.name,
        'login',
        `User logged in from IP ${options.ipAddress}`
      );
      
      // Return user with tokens
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.JWT_EXPIRES_IN
        }
      };
    } catch (error) {
      this.handleError(error, 'Error authenticating user', { loginData });
    }
  }

  /**
   * Request password reset
   * @param email - User email
   * @returns Success message or null
   */
  async requestPasswordReset(email: string): Promise<any | null> {
    try {
      // Validate email
      if (!email) {
        throw new ValidationError('Email is required');
      }
      
      // Get user from repository
      const user = await this.repository.findByEmail(email);
      
      // If no user found, return null (for security, we don't want to reveal if email exists)
      if (!user) {
        return null;
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(resetToken, 10);
      
      // Set token expiry (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Save token to database
      await this.repository.saveResetToken(user.id, hashedToken, expiresAt);
      
      // In a real app, send email with reset link
      // For now, just return token for testing
      return {
        message: 'Password reset email sent',
        // Remove this in production, only for development
        resetToken: resetToken
      };
    } catch (error) {
      this.handleError(error, 'Error requesting password reset', { email });
    }
  }

  /**
   * Validate reset token
   * @param token - Reset token
   * @returns Success message or null
   */
  async validateResetToken(token: string): Promise<any | null> {
    try {
      // Get reset token from repository
      const resetTokenRecord = await this.repository.findResetToken(token);
      
      // If no token found or token expired, return null
      if (!resetTokenRecord || new Date() > resetTokenRecord.expiresAt) {
        return null;
      }
      
      return {
        valid: true,
        userId: resetTokenRecord.userId
      };
    } catch (error) {
      this.handleError(error, 'Error validating reset token', { token });
    }
  }

  /**
   * Reset password
   * @param token - Reset token
   * @param password - New password
   * @param confirmPassword - Confirm new password
   * @returns Success message
   */
  async resetPassword(token: string, password: string, confirmPassword: string): Promise<any> {
    try {
      // Validate passwords
      if (!password || !confirmPassword) {
        throw new ValidationError('Password and confirm password are required');
      }
      
      if (password !== confirmPassword) {
        throw new ValidationError('Passwords do not match');
      }
      
      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
      }
      
      // Validate token
      const resetTokenRecord = await this.repository.findResetToken(token);
      
      // If no token found or token expired, throw error
      if (!resetTokenRecord || new Date() > resetTokenRecord.expiresAt) {
        throw new ValidationError('Invalid or expired token');
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user password
      await this.repository.update(resetTokenRecord.userId, {
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      // Delete used token
      await this.repository.deleteResetToken(resetTokenRecord.id);
      
      // Log activity
      await this.repository.logActivity(
        resetTokenRecord.userId,
        resetTokenRecord.userId,
        'System',
        'password_reset',
        'Password was reset successfully'
      );
      
      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      this.handleError(error, 'Error resetting password', { token });
    }
  }

  /**
   * Refresh access token
   * @param refreshToken - Refresh token
   * @param options - Additional options
   * @returns New tokens
   */
  async refreshToken(refreshToken: string, options: { ipAddress: string }): Promise<any> {
    try {
      // Validate refresh token
      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }
      
      // Find token in database
      const refreshTokenRecord = await this.repository.findRefreshToken(refreshToken);
      
      // If no token found or token revoked, throw error
      if (!refreshTokenRecord || refreshTokenRecord.revoked) {
        throw new ValidationError('Invalid token');
      }
      
      // If token expired, throw error
      if (new Date() > refreshTokenRecord.expiresAt) {
        // Revoke token
        await this.repository.revokeRefreshToken(refreshTokenRecord.id);
        throw new ValidationError('Token expired');
      }
      
      // Get user
      const user = await this.repository.findById(refreshTokenRecord.userId);
      
      // If no user or user inactive, throw error
      if (!user || user.status !== 'aktiv') {
        throw new ValidationError('User account is inactive');
      }
      
      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user, options.ipAddress);
      
      // Revoke old token
      await this.repository.revokeRefreshToken(refreshTokenRecord.id);
      
      // Return new tokens
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: config.JWT_EXPIRES_IN
      };
    } catch (error) {
      this.handleError(error, 'Error refreshing token', { refreshToken });
    }
  }

  /**
   * Logout user by revoking refresh token
   * @param refreshToken - Refresh token
   * @param options - Additional options
   * @returns Success message
   */
  async logout(refreshToken: string, options: { userContext?: any }): Promise<any> {
    try {
      // Validate refresh token
      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }
      
      // Find token in database
      const refreshTokenRecord = await this.repository.findRefreshToken(refreshToken);
      
      // If token found, revoke it
      if (refreshTokenRecord && !refreshTokenRecord.revoked) {
        await this.repository.revokeRefreshToken(refreshTokenRecord.id);
        
        // Log activity if user context provided
        if (options.userContext?.userId) {
          await this.repository.logActivity(
            options.userContext.userId,
            options.userContext.userId,
            options.userContext.userName || 'System',
            'logout',
            `User logged out from IP ${options.userContext.ipAddress || 'unknown'}`
          );
        }
      }
      
      return {
        success: true
      };
    } catch (error) {
      this.handleError(error, 'Error logging out', { refreshToken });
    }
  }

  /**
   * Generate access token
   * @param user - User object
   * @returns JWT access token
   */
  private generateAccessToken(user: any): string {
    const payload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: 'access'
    };
    
    const secret = config.JWT_SECRET;
    
    const options = {
      expiresIn: config.JWT_EXPIRES_IN || '1h'
    } as jwt.SignOptions;
    
    return jwt.sign(payload, secret, options);
  }
  
  /**
   * Generate refresh token
   * @param user - User object
   * @param ipAddress - IP address
   * @returns Refresh token
   */
  private generateRefreshToken(user: any, ipAddress: string): string {
    // Generate token
    const refreshToken = uuidv4();
    
    // Set expiry (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Save token to database
    this.repository.saveRefreshToken(
      refreshToken,
      user.id,
      ipAddress,
      expiresAt
    );
    
    return refreshToken;
  }

  /**
   * Map entity to DTO (required by BaseService)
   */
  mapEntityToDTO(entity: any): any {
    return entity;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
