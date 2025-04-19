'use client';

// This file is specifically for browser-only use - it avoids Node.js crypto modules
// by delegating all auth operations to API calls

import { ApiClient } from './ApiClient';
import { IAuthService } from '@/domain/services/IAuthService';
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

/**
 * Client-side auth service that doesn't use Node.js crypto modules
 * Uses the API client to communicate with the server instead of direct crypto operations
 * 
 * This implements the IAuthService interface but delegates all auth operations to API calls
 * instead of performing crypto operations directly
 */
class AuthClientServiceImpl implements IAuthService {
  /**
   * Perform user login
   */
  async login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto> {
    try {
      const response = await ApiClient.post('/api/auth/login', loginDto);
      
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in AuthClientService.login:', error);
      throw error;
    }
  }

  /**
   * Refresh the auth token
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto, 
    options?: ServiceOptions
  ): Promise<RefreshTokenResponseDto> {
    try {
      const response = await ApiClient.post('/api/auth/refresh', refreshTokenDto);
      
      if (!response.success) {
        throw new Error(response.message || 'Token refresh failed');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in AuthClientService.refreshToken:', error);
      throw error;
    }
  }

  /**
   * Log the user out
   */
  async logout(
    userId: number, 
    logoutDto?: { refreshToken: string; allDevices?: boolean }, 
    options?: ServiceOptions
  ): Promise<{ success: boolean; tokenCount: number }> {
    try {
      const response = await ApiClient.post('/api/auth/logout', logoutDto);
      
      if (!response.success) {
        throw new Error(response.message || 'Logout failed');
      }
      
      return response.data || { success: true, tokenCount: 0 };
    } catch (error) {
      console.error('Error in AuthClientService.logout:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await ApiClient.post('/api/auth/register', registerDto);
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      
      return response;
    } catch (error) {
      console.error('Error in AuthClientService.register:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto, 
    options?: ServiceOptions
  ): Promise<{ success: boolean }> {
    try {
      const response = await ApiClient.post('/api/auth/forgot-password', forgotPasswordDto);
      
      if (!response.success) {
        throw new Error(response.message || 'Password reset request failed');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in AuthClientService.forgotPassword:', error);
      throw error;
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto, 
    options?: ServiceOptions
  ): Promise<{ success: boolean }> {
    try {
      const response = await ApiClient.post('/api/auth/reset-password', resetPasswordDto);
      
      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in AuthClientService.resetPassword:', error);
      throw error;
    }
  }

  /**
   * Validate a reset token
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      const response = await ApiClient.post('/api/auth/validate-token', { token });
      return response.success && Boolean(response.data?.valid);
    } catch (error) {
      console.error('Error in AuthClientService.validateResetToken:', error);
      return false;
    }
  }

  /**
   * Verify a token
   */
  async verifyToken(token: string, options?: ServiceOptions): Promise<{ valid: boolean; userId?: number; }> {
    try {
      const response = await ApiClient.post('/api/auth/validate', { token });
      return response.data || { valid: false };
    } catch (error) {
      console.error('Error in AuthClientService.verifyToken:', error);
      return { valid: false };
    }
  }

  /**
   * Check if a user has a specific role
   */
  async hasRole(userId: number, role: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await ApiClient.get(`/api/users/${userId}`);
      return response.success && response.data?.role === role;
    } catch (error) {
      console.error('Error in AuthClientService.hasRole:', error);
      return false;
    }
  }

  /**
   * Get reset token for testing (not implemented in client)
   */
  async getResetTokenForTesting(email: string): Promise<{ token: string; expiry: Date }> {
    throw new Error('Method not implemented in client environment');
  }
}

// Export a singleton instance that matches the IAuthService interface
export const AuthClientService = new AuthClientServiceImpl();