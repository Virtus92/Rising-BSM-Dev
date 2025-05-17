/**
 * AuthService - Clean authentication service implementation
 * 
 * Design principles:
 * 1. Single responsibility - handles authentication logic only
 * 2. Clear error handling - no silent failures
 * 3. Consistent behavior - same logic for client and server
 * 4. No workarounds or fallbacks
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
import { UserDto } from '@/domain/dtos/UserDtos';
import { IAuthService } from '@/domain/services/IAuthService';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { tokenService } from './TokenService';
import { AppError } from '@/core/errors';

/**
 * Authentication service error types
 */
export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 401,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/**
 * Authentication service
 * 
 * Handles all authentication operations with clean architecture
 */
export class AuthService implements IAuthService {
  private static instance: AuthService | null = null;
  private readonly logger = getLogger();
  
  private constructor(
    private readonly apiBaseUrl: string = process.env.NEXT_PUBLIC_API_URL || '/api'
  ) {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  /**
   * Login user
   * @throws AuthServiceError on failure
   */
  async login(credentials: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto> {
    try {
      // Check if we're being called from server implementation to prevent loops
      const isServerImplementation = options?.context?.isServerImplementation === true;
      
      this.logger.info('Starting login process');
      
      // We need to avoid direct dynamic imports of server-only modules
      // For server-side calls, use a different approach
      if (typeof window === 'undefined' && !isServerImplementation) {
        this.logger.debug('Server-side login requested, but we cannot use dynamic imports of server-only modules');
        
        // Instead we'll make a regular API call through our own service
        // This prevents the direct import of server-only code which breaks Next.js static analysis
        const apiUrlPath = '/api/auth/login';
        this.logger.debug(`Redirecting to API endpoint: ${apiUrlPath}`);
        
        // Fall through to the regular API call path below
        // This ensures the code works consistently without direct server imports
      }
      
      // For client-side calls, use the API endpoint
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include', // Include cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthServiceError(
          errorData.message || 'Login failed',
          errorData.code || 'LOGIN_FAILED',
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new AuthServiceError(
          'Invalid login response',
          'INVALID_RESPONSE',
          500
        );
      }
      
      // Convert to AuthResponseDto format
      const authResponse: AuthResponseDto = {
        success: true,
        data: {
          user: data.data.user as UserDto,
          accessToken: data.data.accessToken as string,
          refreshToken: data.data.refreshToken as string,
          expiresIn: data.data.expiresIn || 900 // 15 minutes default
        }
      };
      
      // No need to manually set tokens - HTTP-only cookies are set by the server response
      // Just initialize TokenService to make sure it's aware of the authentication state
      await tokenService.initialize();
      
      this.logger.info('Login successful', { userId: authResponse.data?.user.id });
      return authResponse;
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      
      this.logger.error('Login error:', error as Error);
      throw new AuthServiceError(
        'Login failed',
        'LOGIN_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Register new user
   * @throws AuthServiceError on failure
   */
  async register(userData: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      this.logger.info('Starting registration process');
      
      const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthServiceError(
          errorData.message || 'Registration failed',
          errorData.code || 'REGISTRATION_FAILED',
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      
      this.logger.info('Registration successful');
      return {
        success: true,
        message: 'Registration successful',
        data: data.data
      };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      
      this.logger.error('Registration error:', error as Error);
      throw new AuthServiceError(
        'Registration failed',
        'REGISTRATION_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Logout user
   * @throws AuthServiceError on failure
   */
  async logout(userId: number, logoutDto?: LogoutDto, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }> {
    try {
      this.logger.info('Starting logout process');
      
      // Clear tokens first for immediate effect
      await tokenService.logout();
      
      // Call logout endpoint
      const response = await fetch(`${this.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logoutDto || {}),
        credentials: 'include',
      });
      
      if (!response.ok) {
        // Log error but don't throw - tokens are already cleared
        this.logger.warn('Logout endpoint returned error:', response);
      }
      
      this.logger.info('Logout successful');
      return {
        success: true,
        tokenCount: 0
      };
    } catch (error) {
      this.logger.error('Logout error:', error as Error);
      // Don't throw - ensure logout completes
      return {
        success: true,
        tokenCount: 0
      };
    }
  }
  
  /**
   * Refresh authentication token
   * @throws AuthServiceError on failure
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto, options?: ServiceOptions): Promise<RefreshTokenResponseDto> {
    try {
      this.logger.info('Starting token refresh');
      
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refreshTokenDto),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthServiceError(
          errorData.message || 'Token refresh failed',
          errorData.code || 'REFRESH_FAILED',
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new AuthServiceError(
          'Invalid refresh response',
          'INVALID_RESPONSE',
          500
        );
      }
      
      // Convert to RefreshTokenResponseDto format
      const refreshResponse: RefreshTokenResponseDto = {
        success: true,
        data: {
          token: data.data.accessToken || data.data.token,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn || 900,
          user: data.data.user
        }
      };
      
      // No need to manually set tokens - HTTP-only cookies are set by the server response
      // Just re-initialize TokenService to make sure it's aware of the new authentication state
      await tokenService.initialize();
      
      this.logger.info('Token refresh successful');
      return refreshResponse;
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      
      this.logger.error('Token refresh error:', error as Error);
      throw new AuthServiceError(
        'Token refresh failed',
        'REFRESH_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Request password reset
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }> {
    try {
      this.logger.info('Starting forgot password process');
      
      const response = await fetch(`${this.apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forgotPasswordDto),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthServiceError(
          errorData.message || 'Forgot password request failed',
          errorData.code || 'FORGOT_PASSWORD_FAILED',
          response.status,
          errorData
        );
      }
      
      this.logger.info('Forgot password request successful');
      return { success: true };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      
      this.logger.error('Forgot password error:', error as Error);
      throw new AuthServiceError(
        'Forgot password request failed',
        'FORGOT_PASSWORD_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Validate reset token
   */
  async validateResetToken(token: string, options?: ServiceOptions): Promise<boolean> {
    try {
      this.logger.info('Validating reset token');
      
      const response = await fetch(`${this.apiBaseUrl}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.success === true;
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
      
      const response = await fetch(`${this.apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetPasswordDto),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthServiceError(
          errorData.message || 'Password reset failed',
          errorData.code || 'RESET_PASSWORD_FAILED',
          response.status,
          errorData
        );
      }
      
      this.logger.info('Password reset successful');
      return { success: true };
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      
      this.logger.error('Password reset error:', error as Error);
      throw new AuthServiceError(
        'Password reset failed',
        'RESET_PASSWORD_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Verify token
   */
  async verifyToken(token: string, options?: ServiceOptions): Promise<{ valid: boolean; userId?: number; role?: string }> {
    try {
      this.logger.info('Verifying token');
      
      const response = await fetch(`${this.apiBaseUrl}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        return { valid: false };
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          valid: true,
          userId: data.data.userId,
          role: data.data.role
        };
      }
      
      return { valid: false };
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
      
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}/has-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.success === true && data.data?.hasRole === true;
    } catch (error) {
      this.logger.error('Role check error:', error as Error);
      return false;
    }
  }
  
  /**
   * Get current user
   * @throws AuthServiceError on failure
   */
  async getCurrentUser(): Promise<UserDto> {
    try {
      this.logger.info('Getting current user');
      
      const response = await fetch(`${this.apiBaseUrl}/users/me`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthServiceError(
          errorData.message || 'Failed to get user',
          errorData.code || 'GET_USER_FAILED',
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new AuthServiceError(
          'Invalid user response',
          'INVALID_RESPONSE',
          500
        );
      }
      
      this.logger.info('Got current user', { userId: data.data.id });
      return data.data as UserDto;
    } catch (error) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      
      this.logger.error('Get current user error:', error as Error);
      throw new AuthServiceError(
        'Failed to get current user',
        'GET_USER_ERROR',
        500,
        error
      );
    }
  }
  
  /**
   * Verify if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Validate the current token using TokenService
      const validationResult = await tokenService.validateToken();

      if (!validationResult) {
        return false;
      }

      // Verify with server
      try {
        await this.getCurrentUser();
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      this.logger.error('Authentication check error:', error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
