import { IAuthService } from '@/domain/services/IAuthService';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '@/domain/repositories/IRefreshTokenRepository';
import { IErrorHandler } from '@/core/errors';
import { ILoggingService } from '@/core/logging';
import { IValidationService } from '@/core/validation/IValidationService';
import { 
  LoginDto, 
  AuthResponseDto, 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RegisterDto
} from '@/domain/dtos/AuthDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole, UserStatus } from '@/domain/entities/User'; 

/**
 * Service for authentication functions
 */
export class AuthService implements IAuthService {
  /**
   * JWT secret for token signing
   */
  private readonly jwtSecret: string;
  
  /**
   * Token expiration time for access tokens in seconds
   */
  private readonly accessTokenExpiry: number;
  
  /**
   * Token expiration time for refresh tokens in days
   */
  private readonly refreshTokenExpiry: number;
  
  /**
   * Whether token rotation is enabled
   */
  private readonly useTokenRotation: boolean;
  
  /**
   * Constructor
   * 
   * @param userRepository - User repository
   * @param refreshTokenRepository - Refresh token repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   * @param config - Configuration
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly logger: ILoggingService,
    private readonly validator: IValidationService,
    private readonly errorHandler: IErrorHandler,
    config?: {
      jwtSecret?: string;
      accessTokenExpiry?: number;
      refreshTokenExpiry?: number;
      useTokenRotation?: boolean;
    }
  ) {
    this.jwtSecret = config?.jwtSecret || process.env.JWT_SECRET || 'default-secret-change-me';
    this.accessTokenExpiry = config?.accessTokenExpiry || 15 * 60; // 15 minutes in seconds
    this.refreshTokenExpiry = config?.refreshTokenExpiry || 7; // 7 days
    this.useTokenRotation = config?.useTokenRotation !== undefined ? config.useTokenRotation : true;
    
    this.logger.debug('Initialized AuthService');
    
    // Start a background process to delete expired tokens
    this.scheduleTokenCleanup();
  }

  /**
   * Handles user login
   * 
   * @param loginDto - Login data
   * @param options - Service options
   * @returns Authentication response
   */
  async login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto> {
    try {
      // Validate the input data
      const schema = {
        email: { type: 'string', format: 'email', required: true },
        password: { type: 'string', minLength: 1, required: true },
        remember: { type: 'boolean' }
      };
      
      const { isValid, errors } = this.validator.validate(loginDto, schema);
      
      if (!isValid) {
        // Throw an error with validation errors
        throw this.errorHandler.createValidationError('Invalid login data', errors);
      }
      
      // Find the user by email address
      const user = await this.userRepository.findByEmail(loginDto.email);
      
      // If no user was found or the password is incorrect
      if (!user || !(await this.verifyPassword(loginDto.password, user.password || ''))) {
        throw this.errorHandler.createUnauthorizedError('Invalid email or password');
      }
      
      // Check if the user is active
      if (!user.isActive()) {
        throw this.errorHandler.createForbiddenError('Account is inactive');
      }
      
      // Update the last login timestamp
      await this.userRepository.updateLastLogin(user.id);
      
      // Create an access token
      const accessToken = this.generateAccessToken(user);
      
      // Calculate expiration time for refresh tokens
      const refreshTokenExpiryDays = loginDto.remember 
        ? this.refreshTokenExpiry * 2 // Extended expiration for "remember me"
        : this.refreshTokenExpiry;
      
      // Create a refresh token
      const refreshToken = await this.generateRefreshToken(
        user.id,
        refreshTokenExpiryDays,
        options?.context?.ipAddress
      );
      
      // Log the login
      await this.userRepository.logActivity(
        user.id,
        'LOGIN',
        'User logged in',
        options?.context?.ipAddress
      );
      
      // Create the authentication response
      return {
        id: user.id,
        accessToken,
        refreshToken: refreshToken.token,
        expiresIn: this.accessTokenExpiry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt.toString(),
          updatedAt: user.updatedAt.toString()
        }
      };
    } catch (error) {
      this.logger.error('Error in AuthService.login', { error, email: loginDto.email });
      throw error;
    }
  }

  /**
   * Refreshes a token
   * 
   * @param refreshTokenDto - Token refresh data
   * @param options - Service options
   * @returns Token refresh response
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto, 
    options?: ServiceOptions
  ): Promise<RefreshTokenResponseDto> {
    try {
      // Validate the input data
      const schema = {
        refreshToken: { type: 'string', minLength: 1, required: true }
      };
      
      const { isValid, errors } = this.validator.validate(refreshTokenDto, schema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid refresh token data', errors);
      }
      
      // Find the refresh token
      const refreshToken = await this.refreshTokenRepository.findByToken(refreshTokenDto.refreshToken);
      
      // If no token was found
      if (!refreshToken) {
        throw this.errorHandler.createUnauthorizedError('Invalid refresh token');
      }
      
      // Check if the token has been revoked
      if (refreshToken.isRevoked) {
        // Revoke all tokens of the user for additional security
        await this.revokeUserTokens(refreshToken.userId, options?.context?.ipAddress);
        
        throw this.errorHandler.createUnauthorizedError('Refresh token has been revoked');
      }
      
      // Check if the token has expired
      if (refreshToken.expiresAt < new Date()) {
        throw this.errorHandler.createUnauthorizedError('Refresh token has expired');
      }
      
      // Find the user
      const user = await this.userRepository.findById(refreshToken.userId);
      
      // If no user was found
      if (!user) {
        throw this.errorHandler.createUnauthorizedError('User not found');
      }
      
      // Check if the user is active
      if (!user.isActive()) {
        throw this.errorHandler.createForbiddenError('Account is inactive');
      }
      
      // Create a new access token
      const accessToken = this.generateAccessToken(user);
      
      // Calculate the number of days until expiration
      const expiryDays = this.refreshTokenExpiry;
      
      // Token rotation, if enabled
      let newRefreshToken = refreshToken;
      
      if (this.useTokenRotation) {
        // Revoke the old token
        await this.revokeRefreshToken(
          refreshToken.token,
          options?.context?.ipAddress,
          'Replaced by new token'
        );
        
        // Create a new refresh token
        newRefreshToken = await this.generateRefreshToken(
          user.id,
          expiryDays,
          options?.context?.ipAddress
        );
      }
      
      // Log the token update
      await this.userRepository.logActivity(
        user.id,
        'TOKEN_REFRESH',
        'Access token refreshed',
        options?.context?.ipAddress
      );
      
      // Create the token refresh response
      return {
        id: user.id,
        accessToken,
        refreshToken: newRefreshToken.token,
        expiresIn: this.accessTokenExpiry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error in AuthService.refreshToken', { error });
      throw error;
    }
  }

  /**
   * Processes a "Forgot Password" request
   * 
   * @param forgotPasswordDto - Forgot password data
   * @param options - Service options
   * @returns Success of the operation
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto, 
    options?: ServiceOptions
  ): Promise<{ success: boolean }> {
    try {
      // Validate the input data
      const schema = {
        email: { type: 'string', format: 'email', required: true }
      };
      
      const { isValid, errors } = this.validator.validate(forgotPasswordDto, schema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid email', errors);
      }
      
      // Find the user by email address
      const user = await this.userRepository.findByEmail(forgotPasswordDto.email);
      
      // If no user was found, we still return success
      // (for security reasons, to avoid disclosing information about existing email addresses)
      if (!user) {
        this.logger.info(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`);
        return { success: true };
      }
      
      // Generate a reset token
      const token = crypto.randomBytes(40).toString('hex');
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // Valid for 24 hours
      
      // Set the reset token for the user
      const updatedUser = user.setResetToken(token, 24);
      await this.userRepository.update(user.id, updatedUser);
      
      // Log the request
      await this.userRepository.logActivity(
        user.id,
        'PASSWORD_RESET_REQUESTED',
        'Password reset token generated',
        options?.context?.ipAddress
      );
      
      // Here we would normally send an email
      // This is a placeholder for the actual email sending
      this.logger.info(`Password reset token for ${user.email}: ${token}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error in AuthService.forgotPassword', { error, email: forgotPasswordDto.email });
      throw error;
    }
  }

  /**
   * Validates a token for password reset
   * 
   * @param token - Token
   * @returns Validity of the token
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      // Validate the token
      if (!token || token.length < 10 || typeof token !== 'string') {
        return false;
      }
      
      // Find a user with this reset token
      const user = await this.userRepository.findOneByCriteria({ resetToken: token });
      
      // If no user was found
      if (!user) {
        return false;
      }
      
      // Check if the token is valid
      return user.isResetTokenValid(token);
    } catch (error) {
      this.logger.error('Error in AuthService.validateResetToken', { error });
      return false;
    }
  }

  /**
   * Resets a password
   * 
   * @param resetPasswordDto - Password reset data
   * @param options - Service options
   * @returns Success of the operation
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto, 
    options?: ServiceOptions
  ): Promise<{ success: boolean }> {
    try {
      // Validate the input data
      const schema = {
        token: { type: 'string', minLength: 10, required: true },
        password: { type: 'string', minLength: 8, required: true },
        confirmPassword: { type: 'string', minLength: 8, required: true }
      };
      
      const { isValid, errors } = this.validator.validate(resetPasswordDto, schema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid reset password data', errors);
      }
      
      // Check if the passwords match
      if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
        throw this.errorHandler.createValidationError(
          'Passwords do not match',
          ['Password and confirmation do not match']
        );
      }
      
      // Find a user with this reset token
      const user = await this.userRepository.findOneByCriteria({ resetToken: resetPasswordDto.token });
      
      // When user is not found or token is invalid
      if (!user || !user.resetToken || resetPasswordDto.token !== user.resetToken) {
        throw this.errorHandler.createUnauthorizedError('Invalid or expired token');
      }
      
      // Hash the new password
      const hashedPassword = await this.hashPassword(resetPasswordDto.password || '');
      
      // Change the password and delete the reset token
      const updatedUser = user.changePassword(hashedPassword);
      await this.userRepository.update(user.id, updatedUser);
      
      // Revoke all existing refresh tokens of the user
      await this.refreshTokenRepository.deleteAllForUser(user.id);
      
      // Log the password change
      await this.userRepository.logActivity(
        user.id,
        'PASSWORD_RESET',
        'Password was reset using a reset token',
        options?.context?.ipAddress
      );
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error in AuthService.resetPassword', { error });
      throw error;
    }
  }

  /**
   * Logs out a user
   * 
   * @param userId - User ID
   * @param logoutDto - Logout data (optional)
   * @param options - Service options
   * @returns Logout result
   */
  async logout(
    userId: number, 
    logoutDto?: { refreshToken: string; allDevices?: boolean }, 
    options?: ServiceOptions
  ): Promise<{ success: boolean; tokenCount: number }> {
    try {
      let tokenCount = 0;
      
      // If a specific token was provided, only revoke that one
      if (logoutDto?.refreshToken) {
        const token = await this.refreshTokenRepository.findByToken(logoutDto.refreshToken);
        
        if (token && token.userId === userId) {
          await this.revokeRefreshToken(
            logoutDto.refreshToken,
            options?.context?.ipAddress,
            'Logout'
          );
          tokenCount = 1;
        }
      } else {
        // Otherwise revoke all tokens of the user
        tokenCount = await this.revokeUserTokens(userId, options?.context?.ipAddress);
      }
      
      // Log the logout
      await this.userRepository.logActivity(
        userId,
        'LOGOUT',
        `User logged out, ${tokenCount} token(s) revoked`,
        options?.context?.ipAddress
      );
      
      return { success: true, tokenCount };
    } catch (error) {
      this.logger.error('Error in AuthService.logout', { error, userId });
      throw error;
    }
  }

  /**
   * Checks if a user is authenticated
   * 
   * @param token - Access token
   * @param options - Service options
   * @returns Authentication status
   */
  async verifyToken(token: string, options?: ServiceOptions): Promise<{ valid: boolean; userId?: number; }> {
    try {
      if (!token) {
        return { valid: false };
      }
      
      // Verify JWT token
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as any;
        
        // Check if the payload is valid
        if (!decoded || !decoded.sub) {
          return { valid: false };
        }
        
        // Get user ID from token
        const userId = parseInt(decoded.sub, 10);
        
        // Check if the user exists and is active
        const user = await this.userRepository.findById(userId);
        
        if (!user || !user.isActive()) {
          return { valid: false };
        }
        
        return { valid: true, userId };
      } catch (error) {
        this.logger.debug('Token verification failed', { error });
        return { valid: false };
      }
    } catch (error) {
      this.logger.error('Error in AuthService.verifyToken', { error });
      return { valid: false };
    }
  }

  /**
   * Checks if a user has the specified role
   * 
   * @param userId - User ID
   * @param role - Role to check
   * @param options - Service options
   * @returns Whether the user has the role
   */
  async hasRole(userId: number, role: string, options?: ServiceOptions): Promise<boolean> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return false;
      }
      
      // Check role
      return user.role === role;
    } catch (error) {
      this.logger.error('Error in AuthService.hasRole', { error, userId, role });
      return false;
    }
  }

  /**
   * Generates a token for password reset (only for tests)
   * 
   * @param email - Email address
   * @returns Token and expiration date
   */
  async getResetTokenForTesting(email: string): Promise<{ token: string; expiry: Date }> {
    try {
      // Only available in non-production environments
      if (process.env.NODE_ENV === 'production') {
        throw this.errorHandler.createForbiddenError('This method is not available in production');
      }
      
      // Find the user by email address
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      // Generate a reset token
      const token = crypto.randomBytes(40).toString('hex');
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24); // Valid for 24 hours
      
      // Set the reset token for the user
      const updatedUser = user.setResetToken(token, 24);
      await this.userRepository.update(user.id, updatedUser);
      
      this.logger.warn('Generated reset token for testing', { email, token });
      
      return { token, expiry };
    } catch (error) {
      this.logger.error('Error in AuthService.getResetTokenForTesting', { error, email });
      throw error;
    }
  }

  /**
   * Generates an access token for a user
   * 
   * @param user - User
   * @returns JWT Access Token
   */
  private generateAccessToken(user: any): string {
    // Create payload for the JWT
    const payload = {
      sub: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.accessTokenExpiry,
      // Add required claims for standard JWT validation
      iss: 'rising-bsm',
      aud: process.env.JWT_AUDIENCE || 'rising-bsm-app'
    };
    
    // Sign the token
    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Generates a refresh token for a user
   * 
   * @param userId - User ID
   * @param expiryDays - Expiration time in days
   * @param ipAddress - IP address
   * @returns Refresh Token
   */
  private async generateRefreshToken(
    userId: number, 
    expiryDays: number, 
    ipAddress?: string
  ): Promise<any> {
    // Create expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    // Create a random token
    const token = crypto.randomBytes(40).toString('hex');
    
    // Store the token in the database
    const refreshToken = await this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      createdAt: new Date(),
      createdByIp: ipAddress,
      isRevoked: false
    });
    
    return refreshToken;
  }

  /**
   * Revokes a refresh token
   * 
   * @param token - Token
   * @param ipAddress - IP address
   * @param reason - Reason
   * @returns Success of the operation
   */
  private async revokeRefreshToken(token: string, ipAddress?: string, reason?: string): Promise<boolean> {
    try {
      // Find the token
      const refreshToken = await this.refreshTokenRepository.findByToken(token);
      
      if (!refreshToken || refreshToken.isRevoked) {
        return false;
      }
      
      // Set revocation information
      const updatedToken = {
        ...refreshToken,
        revokedAt: new Date(),
        revokedByIp: ipAddress,
        isRevoked: true,
        // Optional replacement token
        ...(reason ? { replacedByToken: reason } : {})
      };
      
      // Remove updatedAt field to prevent Prisma errors
      // since RefreshToken model does not have this field
      delete updatedToken.updatedAt;
      
      this.logger.debug('Removed id and updatedAt from update data to prevent Prisma errors');
      
      // Update the token
      await this.refreshTokenRepository.update(token, updatedToken);
      
      return true;
    } catch (error) {
      this.logger.error('Error in AuthService.revokeRefreshToken', { error, token });
      return false;
    }
  }

  /**
   * Revokes all tokens of a user
   * 
   * @param userId - User ID
   * @param ipAddress - IP address
   * @returns Number of revoked tokens
   */
  private async revokeUserTokens(userId: number, ipAddress?: string): Promise<number> {
    try {
      // Get all active tokens of the user
      const activeTokens = await this.refreshTokenRepository.findByUserId(userId);
      const nonRevokedTokens = activeTokens.filter(token => !token.isRevoked);
      
      // If there are no non-revoked tokens
      if (nonRevokedTokens.length === 0) {
        return 0;
      }
      
      // Revoke each token
      for (const token of nonRevokedTokens) {
        await this.revokeRefreshToken(token.token, ipAddress, 'Revoked on logout');
      }
      
      return nonRevokedTokens.length;
    } catch (error) {
      this.logger.error('Error in AuthService.revokeUserTokens', { error, userId });
      return 0;
    }
  }

  /**
   * Schedules regular cleanup of expired tokens
   */
  private scheduleTokenCleanup(): void {
    // Clean up expired tokens at initialization
    this.cleanupExpiredTokens();
    
    // Schedule cleanup every 24 hours
    setInterval(() => this.cleanupExpiredTokens(), 24 * 60 * 60 * 1000);
  }

  /**
   * Cleans up expired tokens
   */
  private async cleanupExpiredTokens(): Promise<void> {
    try {
      const deletedCount = await this.refreshTokenRepository.deleteExpiredTokens();
      
      if (deletedCount > 0) {
        this.logger.info(`Cleaned up ${deletedCount} expired refresh tokens`);
      }
    } catch (error) {
      this.logger.error('Error in AuthService.cleanupExpiredTokens', { error });
    }
  }

  /**
   * Hashes a password
   * 
   * @param password - Password to hash
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcryptjs.hash(password, saltRounds);
  }

  /**
   * Verifies a password
   * 
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password
   * @returns Whether the password is valid
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcryptjs.compare(plainPassword, hashedPassword);
  }

  /**
   * Registers a new user
   * 
   * @param registerDto - Registration data
   * @param options - Service options
   * @returns Registration result
   */
  async register(registerDto: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      // Validate input data
      const schema = {
        name: { type: 'string', minLength: 2, required: true },
        email: { type: 'string', format: 'email', required: true },
        password: { type: 'string', minLength: 8, required: true },
        role: { type: 'string', enum: ['user', 'admin', 'employee'], required: false },
        terms: { type: 'boolean', required: true }
      };
      
      const { isValid, errors } = this.validator.validate(registerDto, schema);
      
      if (!isValid) {
        throw this.errorHandler.createValidationError('Invalid registration data', errors);
      }
      
      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      
      if (existingUser) {
        throw this.errorHandler.createConflictError('E-Mail address is already in use');
      }
      
      // Hash password
      const hashedPassword = await this.hashPassword(registerDto.password);
      
      // Import or ensure UserRole and UserStatus enums are available
      // This assumes these are imported at the top of the file

      // Create user
      const user = await this.userRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role || UserRole.USER,
        status: UserStatus.ACTIVE,
        phone: registerDto.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Log activity
      await this.userRepository.logActivity(
        user.id,
        'REGISTER',
        'User registered',
        options?.context?.ipAddress
      );
      
      return { 
        success: true, 
        message: 'Registration successful', 
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      this.logger.error('Error in AuthService.register', { error, email: registerDto.email });
      throw error;
    }
  }
}