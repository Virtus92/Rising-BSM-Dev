/**
 * AuthService.server.ts
 * 
 * Server-side implementation of the Auth Service.
 * This service provides authentication operations on the server side.
 * 
 * IMPORTANT: This file should only be imported from server-side code.
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { getLogger } from '@/core/logging';
import { verifyPassword } from '@/core/security/password-utils';
import { IAuthService } from '@/domain/services/IAuthService';
import { IRefreshTokenService } from '@/domain/services/IRefreshTokenService';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { 
  LoginDto, 
  AuthResponseDto, 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LogoutDto,
  RegisterDto
} from '@/domain/dtos/AuthDtos';
import { UserDto } from '@/domain/dtos/UserDtos';
import { securityConfig } from '@/core/config/SecurityConfig';
import { jwtDecode } from 'jwt-decode';
import { sign, verify } from 'jsonwebtoken';
import { getRefreshTokenRepository } from '@/core/factories/repositoryFactory.server';
import { getUserRepository } from '@/core/factories/repositoryFactory.server';
import { UserRole } from '@/domain';
import { UserStatus } from '@/domain';

// Get repositories
const refreshTokenRepository = getRefreshTokenRepository();
const userRepository = getUserRepository();

// Get logger
const logger = getLogger();

/**
 * Server-side implementation of IAuthService
 */
export class AuthServiceServer implements IAuthService {
  /**
   * Login with email and password
   * 
   * @param loginDto - Login credentials
   * @param options - Service options
   * @returns Authentication result with tokens and user info
   */
  async login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto> {
    try {
      logger.info('AuthService.server: Login attempt', {
        email: loginDto.email,
        ipAddress: loginDto.ipAddress || 'unknown',
        context: options?.context?.requestId || 'unknown',
      });
      
      // Find user by email
      const user = await userRepository.findByEmail(loginDto.email);
      
      // Check if user exists
      if (!user) {
        logger.warn('AuthService.server: Login failed - User not found', {
          email: loginDto.email,
        });
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }
      
      // Check if user is active
      if (user.status !== 'active') {
        logger.warn('AuthService.server: Login failed - User not active', {
          email: loginDto.email,
          status: user.status,
        });
        return {
          success: false,
          message: 'Account is not active. Please contact admin.'
        };
      }
      
      // Verify password
      if (!user.password) {
        logger.error('AuthService.server: User has no password', {
          userId: user.id,
        });
        return {
          success: false,
          message: 'Invalid account configuration'
        };
      }
      
      const isPasswordValid = await verifyPassword(loginDto.password, user.password);
      
      if (!isPasswordValid) {
        logger.warn('AuthService.server: Login failed - Invalid password', {
          userId: user.id,
        });
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }
      
      // Generate JWT tokens
      const accessToken = this.generateAccessToken(user);
      
      // Create refresh token
      const refreshToken = await refreshTokenRepository.create({
        userId: user.id,
        token: this.generateRefreshTokenValue(),
        expiresAt: new Date(Date.now() + securityConfig.getRefreshTokenLifetime() * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        isRevoked: false
      });
      
      // Record login IP if available
      if (loginDto.ipAddress) {
        await userRepository.update(user.id, {
          lastLoginAt: new Date(),
        });
      }
      
      // Create success response
      const response: AuthResponseDto = {
        success: true,
        accessToken,
        refreshToken: refreshToken.token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          accessToken,
          refreshToken: refreshToken.token,
          expiresIn: securityConfig.getAccessTokenLifetime()
        },
        accessExpiration: Date.now() + securityConfig.getAccessTokenLifetime() * 1000,
        refreshExpiration: refreshToken.expiresAt.getTime()
      };
      
      logger.info('AuthService.server: Login successful', {
        userId: user.id,
        tokenExpiry: response.accessExpiration ? new Date(response.accessExpiration) : undefined,
      });
      
      return response;
    } catch (error) {
      logger.error('AuthService.server: Login error', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }
  
  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto, options?: ServiceOptions): Promise<RefreshTokenResponseDto> {
    try {
      // Find the refresh token in the database
      const token = await refreshTokenRepository.findByToken(refreshTokenDto.refreshToken);
      
      if (!token) {
        return {
          success: false,
          message: 'Invalid refresh token'
        };
      }
      
      // Check if token is expired or revoked
      if (token.isExpired() || token.isRevoked) {
        return {
          success: false,
          message: 'Refresh token is expired or revoked'
        };
      }
      
      // Get user
      const user = await userRepository.findById(token.userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Generate new access token
      const accessToken = this.generateAccessToken(user);
      
      // Optionally rotate refresh token
      let newRefreshToken = token;
      
      if (refreshTokenDto.refreshToken) {
        // Revoke the current token
        try {
        logger.debug('Revoking refresh token', { tokenId: token.token.substring(0, 8) });
        
        // Use the token string as the primary key (matches Prisma schema)
        await refreshTokenRepository.update(token.token, {
            isRevoked: true,
          revokedAt: new Date(),
          revokedByIp: refreshTokenDto.ipAddress,
          replacedByToken: this.generateRefreshTokenValue()
        });
      } catch (revocationError) {
        logger.error('Failed to revoke refresh token', {
          error: revocationError,
          tokenId: token.token.substring(0, 8)
        });
        // Continue execution to create a new token regardless
      }
        
        // Create a new refresh token
        newRefreshToken = await refreshTokenRepository.create({
          userId: user.id,
          token: this.generateRefreshTokenValue(),
          expiresAt: new Date(Date.now() + securityConfig.getRefreshTokenLifetime() * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          isRevoked: false
        });
      }
      
      // Create response
      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken.token,
        data: {
          token: accessToken,
          refreshToken: newRefreshToken.token,
          expiresIn: securityConfig.getAccessTokenLifetime(),
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      };
    } catch (error) {
      logger.error('RefreshToken error:', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refresh token'
      };
    }
  }
  
  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      // Check if email already exists
      const existingUser = await userRepository.findByEmail(registerDto.email);
      
      if (existingUser) {
        return {
          success: false,
          message: 'Email already in use'
        };
      }
      
      // Create user
      const user = await userRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password, // Will be hashed by the repository
        role: UserRole.USER, // Default role
        status: UserStatus.ACTIVE, // Default status
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return {
        success: true,
        message: 'Registration successful',
        data: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      logger.error('Registration error:', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }
  
  /**
   * Process a "Forgot Password" request
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      // We just validate the email exists and return success
      // The actual email sending would be implemented elsewhere
      const user = await userRepository.findByEmail(forgotPasswordDto.email);
      
      // Always return success to prevent email enumeration attacks
      return { success: true };
    } catch (error) {
      logger.error('Forgot password error:', error as Error);
      // Still return success to prevent email enumeration
      return { success: true };
    }
  }
  
  /**
   * Validate a reset token
   */
  async validateResetToken(token: string, options?: ServiceOptions): Promise<boolean> {
    try {
      // This would validate a password reset token
      // Implementation depends on how reset tokens are stored
      return true;
    } catch (error) {
      logger.error('Token validation error:', error as Error);
      return false;
    }
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      // This would validate the token and update the password
      // Implementation depends on password reset flow
      return { success: true };
    } catch (error) {
      logger.error('Password reset error:', error as Error);
      return { success: false };
    }
  }
  
  /**
   * Log out user
   */
  async logout(userId: number, logoutDto?: LogoutDto, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }> {
    try {
      // Revoke all refresh tokens for the user
      const revokedCount = await refreshTokenRepository.revokeAllUserTokens(userId);
      
      return {
        success: true,
        tokenCount: revokedCount
      };
    } catch (error) {
      logger.error('Logout error:', error as Error);
      return {
        success: false,
        tokenCount: 0
      };
    }
  }
  
  /**
   * Verify an auth token
   * 
   * @param token - The token to verify
   * @param options - Optional service options
   * @returns Authentication status with user ID if valid
   */
  async verifyToken(token: string, options?: ServiceOptions): Promise<{ valid: boolean; userId?: number; role?: string }> {
    try {
      // Verify token signature with proper audience and issuer
      const decoded = verify(token, securityConfig.getJwtSecret(), {
        audience: securityConfig.getJwtAudience(),
        issuer: securityConfig.getJwtIssuer()
      }) as any;
      
      // Check expiration
      const expiresAt = new Date(decoded.exp * 1000);
      if (Date.now() >= expiresAt.getTime()) {
        return { valid: false };
      }
      
      // Extract user ID
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else {
        userId = parseInt(decoded.sub, 10);
        if (isNaN(userId)) {
          return { valid: false };
        }
      }
      
      // Check if user exists and is active
      const user = await userRepository.findById(userId);
      
      if (!user || user.status !== 'active') {
        return { valid: false };
      }
      
      return {
        valid: true,
        userId,
        role: decoded.role
      };
    } catch (error) {
      logger.error('Token verification error:', error as Error);
      return { valid: false };
    }
  }
  
  /**
   * Check if user has a specific role
   */
  async hasRole(userId: number, role: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const user = await userRepository.findById(userId);
      
      if (!user) {
        return false;
      }
      
      return user.role === role;
    } catch (error) {
      logger.error('Role check error:', error as Error);
      return false;
    }
  }
  
  /**
   * Get current user as UserDto
   */
  async getCurrentUser(): Promise<UserDto> {
    throw new Error('getCurrentUser should not be called on the server - use authentication middleware instead');
  }
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    throw new Error('isAuthenticated should not be called on the server - use authentication middleware instead');
  }

  /**
   * Generate authentication tokens for a user
   * 
   * @param user - User data
   * @returns Access token and expiration time
   */
  async generateAuthTokens(user: any): Promise<{ accessToken: string; expiresIn: number }> {
    const accessToken = this.generateAccessToken(user);
    const expiresIn = securityConfig.getAccessTokenLifetime();
    
    return {
      accessToken,
      expiresIn
    };
  }
  
  /**
   * Generate an access token for a user
   */
  private generateAccessToken(user: any): string {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    return sign(payload, securityConfig.getJwtSecret(), {
      expiresIn: securityConfig.getAccessTokenLifetime(),
      audience: process.env.JWT_AUDIENCE || 'rising-bsm-app',
      issuer: process.env.JWT_ISSUER || 'rising-bsm'
    });
  }
  
  /**
   * Generate a random refresh token value
   */
  private generateRefreshTokenValue(): string {
    return Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
  }
}

// Export singleton instance
export const authServiceServer = new AuthServiceServer();

// Default export
export default authServiceServer;