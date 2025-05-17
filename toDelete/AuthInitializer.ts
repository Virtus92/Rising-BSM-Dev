'use client';

/**
 * DEPRECATED: This module has been replaced by the new auth system
 * Use AuthService directly from @/features/auth/core instead.
 * 
 * This file will be removed in a future update.
 */

import { AuthService } from '@/features/auth/core/AuthService';
import { getLogger } from '@/core/logging';

const logger = getLogger();

// Log deprecation warning when imported
logger.warn('DEPRECATED: Using legacy AuthInitializer. Import AuthService from @/features/auth/core instead.');

/**
 * Initialize the authentication system
 * @param options - Initialization options
 */
export const initializeAuth = async (options?: { force?: boolean }): Promise<boolean> => {
  logger.warn('DEPRECATED: Using initializeAuth(). Use AuthService.initialize() instead.');
  return AuthService.initialize(options);
};

/**
 * Check if authentication is initialized
 */
export const isAuthInitialized = (): boolean => {
  logger.warn('DEPRECATED: Using isAuthInitialized(). Use AuthService.isInitialized() instead.');
  return AuthService.isInitialized();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  logger.warn('DEPRECATED: Using isAuthenticated(). Use AuthService.isAuthenticated() instead.');
  return AuthService.isAuthenticated();
};

/**
 * Get the current authenticated user
 */
export const getUserFromTokenSync = (): any => {
  logger.warn('DEPRECATED: Using getUserFromTokenSync(). Use AuthService.getUser() instead.');
  return AuthService.getUser();
};

/**
 * Subscribe to authentication state changes
 * @param callback - Callback function to handle state changes
 */
export const subscribeToAuthEvent = (callback: (state: any) => void): () => void => {
  logger.warn('DEPRECATED: Using subscribeToAuthEvent(). Use AuthService.onAuthStateChange() instead.');
  return AuthService.onAuthStateChange(callback);
};

/**
 * Get the current authentication status
 */
export const getAuthStatus = (): { isAuthenticated: boolean; user: any } => {
  logger.warn('DEPRECATED: Using getAuthStatus(). Use AuthService.getAuthState() instead.');
  const state = AuthService.getAuthState();
  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user
  };
};

/**
 * Clear authentication state
 */
export const clearAuthState = async (): Promise<boolean> => {
  logger.warn('DEPRECATED: Using clearAuthState(). Use AuthService.signOut() instead.');
  return AuthService.signOut();
};

// Export flag to indicate this is the deprecated version
export const USING_LEGACY_INITIALIZER = true;

export default {
  initializeAuth,
  isAuthInitialized,
  isAuthenticated,
  getUserFromTokenSync,
  subscribeToAuthEvent,
  getAuthStatus,
  clearAuthState,
  USING_LEGACY_INITIALIZER
};
