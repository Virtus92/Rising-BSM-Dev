'use client';

/**
 * Centralized authentication client
 * @module features/auth/lib/clients
 */

import { ApiClient } from '@/core/api/ApiClient';
import { getLogger } from '@/core/logging';
import AuthService from '@/features/auth/core/AuthService';

const logger = getLogger();

/**
 * AuthClient provides standardized methods for authentication API calls.
 * This implementation uses the centralized ApiClient and AuthService.
 */
export const AuthClient = {
  /**
   * Initialize the auth client
   * Ensures authentication is properly initialized
   */
  initialize: async (): Promise<boolean> => {
    logger.info('Initializing auth client via AuthService');
    return AuthService.initialize();
  },

  /**
   * Login with credentials
   * @param email - User email
   * @param password - User password
   */
  login: async (email: string, password: string): Promise<any> => {
    return AuthService.login({ email, password });
  },

  /**
   * Register a new user
   * @param registerData - Registration data
   */
  register: async (registerData: any): Promise<any> => {
    return AuthService.register(registerData);
  },

  /**
   * Log out the current user
   */
  logout: async (): Promise<any> => {
    const user = AuthService.getUser();
    if (user) {
      return AuthService.logout(user.id);
    }
    return { success: false, message: 'No authenticated user' };
  },

  /**
   * Request a password reset
   * @param email - User email
   */
  forgotPassword: async (email: string): Promise<any> => {
    return AuthService.forgotPassword({ email });
  },

  /**
   * Reset password with token
   * @param token - Reset token
   * @param password - New password
   */
  resetPassword: async (token: string, password: string, confirmPassword: string): Promise<any> => {
    return AuthService.resetPassword({ token, password, confirmPassword});
  },

  /**
   * Validate a reset token
   * @param token - Reset token
   */
  validateResetToken: async (token: string): Promise<any> => {
    return AuthService.validateResetToken(token);
  },

  /**
   * Make a GET request with authentication
   * @param url - API endpoint
   * @param options - Request options
   */
  get: (url: string, options?: any) => ApiClient.get(url, options),

  /**
   * Make a POST request with authentication
   * @param url - API endpoint
   * @param data - Request data
   * @param options - Request options
   */
  post: (url: string, data?: any, options?: any) => ApiClient.post(url, data, options),

  /**
   * Make a PUT request with authentication
   * @param url - API endpoint
   * @param data - Request data
   * @param options - Request options
   */
  put: (url: string, data?: any, options?: any) => ApiClient.put(url, data, options),

  /**
   * Make a DELETE request with authentication
   * @param url - API endpoint
   * @param options - Request options
   */
  delete: (url: string, options?: any) => ApiClient.delete(url, options)
};

export default AuthClient;
