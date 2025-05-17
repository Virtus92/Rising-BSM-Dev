/**
 * AuthServiceImpl - Server-side authentication service implementation
 * 
 * This service directly handles authentication operations without API calls,
 * preventing circular dependencies and infinite loops.
 */
import { getLogger } from '@/core/logging';
import { 
  LoginDto, 
  RegisterDto, 
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  LogoutDto
} from '@/domain/dtos/AuthDtos';
import { UserDto, CreateUserDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { IAuthService } from '@/domain/services/IAuthService';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { AppError } from '@/core/errors';
import jwt from 'jsonwebtoken';

// Track ongoing login processes by request ID to prevent loops
// Use a proper tracking mechanism with automatic cleanup
const loginRequestTracker = (() => {
  const ongoing = new Map<string, number>();
  const timeout = 30000; // 30 seconds maximum lifetime for a request tracking entry
  
  return {
    add: (requestId: string): void => {
      ongoing.set(requestId, Date.now());
      
      // Set cleanup timer for this request
      setTimeout(() => {
        if (ongoing.has(requestId)) {
          ongoing.delete(requestId);
        }
      }, timeout);
    },
    has: (requestId: string): boolean => {
      if (!ongoing.has(requestId)) return false;
      
      // Check for stale entries (older than timeout)
      const timestamp = ongoing.get(requestId) || 0;
      if (Date.now() - timestamp > timeout) {
        ongoing.delete(requestId);
        return false;
      }
      
      return true;
    },
    delete: (requestId: string): void => {
      ongoing.delete(requestId);
    },
    clear: (): void => {
      ongoing.clear();
    }
  };
})();

export interface JWTPayload {
  userId: number;
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Server-side authentication service implementation
 * 
 * Handles authentication operations directly without API calls
 */
export class AuthServiceImpl implements IAuthService {
  private static instance: AuthServiceImpl | null = null;
  private readonly logger = getLogger();
  
  private constructor() {
    this.logger.info('AuthServiceImpl initialized');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): AuthServiceImpl {
    if (!AuthServiceImpl.instance) {
      AuthServiceImpl.instance = new AuthServiceImpl();
    }
    return AuthServiceImpl.instance;
  }
  
  /**
   * Login user - Direct implementation
   */
  async login(credentials: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto> {
    // Generate a unique request ID or use the one provided
    const requestId = options?.context?.requestId || crypto.randomUUID();
    
    // Check if we're already processing this login request to prevent loops
    if (loginRequestTracker.has(requestId)) {
      this.logger.warn('Detected recursive login call in AuthServiceImpl, aborting', { requestId });
      throw new AppError('Recursive login call detected', 500);
    }
    
    // Add request to tracking set with proper cleanup
    loginRequestTracker.add(requestId);
    
    try {
      this.logger.info('Starting login process (implementation)', { requestId });
      
      // Get user and refresh token services
      const userService = getServiceFactory().createUserService();
      const refreshTokenService = getServiceFactory().createRefreshTokenService();
      const securityConfig = getServiceFactory().createSecurityConfig();
      
      // Authenticate user
      const user = await userService.authenticate(credentials.email, credentials.password, {
        ip: (credentials as any).ipAddress,
        ...options
      });
      
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }
      
      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError('Account is not active. Please contact admin.', 403);
      }
      
      // Generate JWT tokens
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT_SECRET not configured', 500);
      }
      
      // Access token payload
      const accessTokenPayload = {
        userId: user.id,
        sub: user.id.toString(),
        email: user.email,
        role: user.role
      };
      
      // Refresh token payload
      const refreshTokenPayload = {
        userId: user.id,
        sub: user.id.toString(),
        type: 'refresh'
      };
      
      // Generate tokens with proper expiration
      const accessExpiration = Number(securityConfig.getAccessTokenLifetime()); // seconds
      const refreshExpiration = Number(securityConfig.getRefreshTokenLifetime()); // seconds
      
      const accessToken = jwt.sign(accessTokenPayload, jwtSecret, {
        expiresIn: accessExpiration,
        issuer: 'rising-bsm',
        audience: process.env.JWT_AUDIENCE || 'rising-bsm-app'
      });
      
      const refreshToken = jwt.sign(refreshTokenPayload, jwtSecret, {
        expiresIn: refreshExpiration,
        issuer: 'rising-bsm',
        audience: process.env.JWT_AUDIENCE || 'rising-bsm-app'
      });
      
      // Save refresh token to database
      await refreshTokenService.create({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + refreshExpiration * 1000),
        createdByIp: (credentials as any).ipAddress || 'unknown'
      }, options);
      
      // Return auth response with all required fields
      const authResponse: AuthResponseDto = {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            phone: user.phone,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          accessToken,
          refreshToken,
          expiresIn: accessExpiration
        }
      };
      
      // Also include backward compatibility properties
      const result = {
        ...authResponse,
        // Add properties at root level for compatibility
        user: authResponse.data?.user,
        accessToken: authResponse.data?.accessToken,
        refreshToken: authResponse.data?.refreshToken,
        expiresIn: authResponse.data?.expiresIn,
        accessExpiration,
        refreshExpiration
      } as any;
      
      // Remove request from tracking before returning
      loginRequestTracker.delete(requestId);
      
      return result;
    } catch (error) {
      this.logger.error('Login error:', error as Error);
      
      // Clean up the request tracking
      loginRequestTracker.delete(requestId);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Login failed', 500);
    } finally {
      // Ensure cleanup happens even with uncaught exceptions
      loginRequestTracker.delete(requestId);
    }
  }
  
  /**
   * Register new user
   */
  async register(userData: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      this.logger.info('Starting registration process');
      
      const userService = getServiceFactory().createUserService();
      
      // Prepare create user DTO with proper types
      const createUserDto: CreateUserDto = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: UserRole.USER, // Set default role (RegisterDto doesn't have role)
        status: UserStatus.ACTIVE,
        phone: userData.phone
      };
      
      const user = await userService.create(createUserDto, options);
      
      return {
        success: true,
        message: 'Registration successful',
        data: user
      };
    } catch (error) {
      this.logger.error('Registration error:', error as Error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Registration failed', 500);
    }
  }
  
  /**
   * Logout user
   */
  async logout(userId: number, logoutDto?: LogoutDto, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }> {
    try {
      this.logger.info('Starting logout process');
      
      const refreshTokenService = getServiceFactory().createRefreshTokenService();
      
      // Revoke all active tokens for the user
      const tokenCount = await refreshTokenService.revokeAllUserTokens(Number(userId), options);
      
      return {
        success: true,
        tokenCount
      };
    } catch (error) {
      this.logger.error('Logout error:', error as Error);
      
      // Don't throw on logout - always succeed
      return {
        success: true,
        tokenCount: 0
      };
    }
  }
  
  /**
   * Refresh authentication token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto, options?: ServiceOptions): Promise<RefreshTokenResponseDto> {
    // For tracking the refresh token context
    const { getAsyncLocalStorage } = await import('@/shared/utils/asyncLocalStorage');
    try {
      this.logger.info('Starting token refresh');
      
      const refreshTokenService = getServiceFactory().createRefreshTokenService();
      const userService = getServiceFactory().createUserService();
      const securityConfig = getServiceFactory().createSecurityConfig();
      
      // Verify refresh token in database
      const tokenRecord = await refreshTokenService.findByToken(refreshTokenDto.refreshToken);
      
      if (!tokenRecord || tokenRecord.isExpired() || tokenRecord.isRevoked) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      
      // Get user
      const user = await userService.getById(Number(tokenRecord.userId));
      
      // Set userId in async local storage for getCurrentUser to use
      const store = getAsyncLocalStorage().getStore() || {};
      store.userId = tokenRecord.userId;
      getAsyncLocalStorage().enterWith(store);
      
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new AppError('User not found or inactive', 401);
      }
      
      // Generate new access token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT_SECRET not configured', 500);
      }
      
      const accessTokenPayload = {
        userId: user.id,
        sub: user.id.toString(),
        email: user.email,
        role: user.role
      };
      
      const accessExpiration = Number(securityConfig.getAccessTokenLifetime());
      
      const newAccessToken = jwt.sign(accessTokenPayload, jwtSecret, {
        expiresIn: accessExpiration,
        issuer: 'rising-bsm',
        audience: process.env.JWT_AUDIENCE || 'rising-bsm-app'
      });
      
      // Return refresh response
      return {
        success: true,
        data: {
          token: newAccessToken,
          refreshToken: refreshTokenDto.refreshToken, // Keep same refresh token
          expiresIn: accessExpiration,
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
      this.logger.error('Token refresh error:', error as Error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Token refresh failed', 500);
    }
  }
  
  /**
   * Request password reset
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      this.logger.info('Starting forgot password process');
      
      // TODO: Implement password reset token generation and email sending
      
      return { success: true };
    } catch (error) {
      this.logger.error('Forgot password error:', error as Error);
      
      throw new AppError('Forgot password request failed', 500);
    }
  }
  
  /**
   * Validate reset token
   */
  async validateResetToken(token: string, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.info('Validating reset token');
      
      // TODO: Implement reset token validation
      
      return false;
    } catch (error) {
      this.logger.error('Validate reset token error:', error as Error);
      return false;
    }
  }
  
  /**
   * Reset password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      this.logger.info('Starting password reset');
      
      // TODO: Implement password reset
      
      return { success: true };
    } catch (error) {
      this.logger.error('Password reset error:', error as Error);
      
      throw new AppError('Password reset failed', 500);
    }
  }
  
  /**
   * Verify token
   */
  async verifyToken(token: string, options?: ServiceOptions): Promise<{ valid: boolean; userId?: number; role?: string }> {
    try {
      this.logger.info('Verifying token');
      
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return { valid: false };
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      
      // Check expiration
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false };
      }
      
      return {
        valid: true,
        userId: Number(decoded.userId),
        role: decoded.role
      };
    } catch (error) {
      this.logger.error('Token verification error:', error as Error);
      return { valid: false };
    }
  }
  
  /**
   * Check if user has role
   */
  async hasRole(userId: number, role: string, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.info('Checking user role', { userId, role });
      
      const userService = getServiceFactory().createUserService();
      const user = await userService.getById(Number(userId));
      
      if (!user) {
        return false;
      }
      
      return user.role === role;
    } catch (error) {
      this.logger.error('Role check error:', error as Error);
      return false;
    }
  }
  
  /**
   * Get current user based on token context
   * 
   * This server-side implementation creates a user object from the token data.
   * It can be used in scenarios where we're working with data from an existing token.
   */
  async getCurrentUser(): Promise<UserDto> {
    try {
      // If we're in a stateless context, we can return user data from the token
      // This is particularly useful in token refresh operations
      
      // Get user service
      const userService = getServiceFactory().createUserService();
      
      // Extract user data from thread-local storage or token context
      // For now, use a placeholder implementation that returns a minimal user
      // This would need to be improved with proper token context in the future
      const tokenContext = await this.getServerTokenContext();
      
      if (tokenContext && tokenContext.userId) {
        const user = await userService.getById(tokenContext.userId);
        
        if (user) {
          return user;
        }
      }
      
      throw new AppError('Current user not available in server context', 401);
    } catch (error) {
      this.logger.error('getCurrentUser error:', error as Error);
      throw new AppError('Unable to get current user', 401);
    }
  }
  
  /**
   * Helper method to get token context from the server environment
   * Extracts user information from the RefreshToken entity
   */
  private async getServerTokenContext(): Promise<{ userId?: number; email?: string } | null> {
    try {
      // Look for userId in the async local storage context
      // This should be from the token refresh process
      
      // In a refresh token context, we should have the userId from the refresh token
      const { getAsyncLocalStorage } = await import('@/shared/utils/asyncLocalStorage');
      const context = getAsyncLocalStorage().getStore();
      
      if (context && context.userId) {
        this.logger.debug('Found userId in async local storage context:', { userId: context.userId });
        return { userId: context.userId };
      }
      
      this.logger.debug('No userId found in async local storage context');
      return null;
    } catch (error) {
      this.logger.error('Error getting server token context:', error as Error);
      return null;
    }
  }
  
  /**
   * Verify if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    throw new AppError('isAuthenticated not implemented for server-side auth service', 500);
  }
}

// Export singleton instance
export const authServiceImpl = AuthServiceImpl.getInstance();
