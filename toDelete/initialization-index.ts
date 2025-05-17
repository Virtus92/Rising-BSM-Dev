/**
 * COMPATIBILITY LAYER - DO NOT USE IN NEW CODE
 * 
 * This module provides backward compatibility with code that imported
 * the old AuthInitializer. All functionality is now in AuthService.
 */

import { getLogger } from '@/core/logging';
import { AuthService } from '@/features/auth/core/AuthService';

const logger = getLogger();

// Log warning when imported
logger.warn('DEPRECATED: Using auth/lib/initialization. Import AuthService from @/features/auth/core instead.');

// Re-export AuthService functionality with deprecation warnings
export const initializeAuth = AuthService.initialize.bind(AuthService);
export const isAuthInitialized = AuthService.isInitialized.bind(AuthService);
export const isAuthenticated = AuthService.isAuthenticated.bind(AuthService);
export const getUserFromTokenSync = AuthService.getUser.bind(AuthService);
export const subscribeToAuthEvent = AuthService.onAuthStateChange.bind(AuthService);
export const getAuthStatus = () => {
  logger.warn('DEPRECATED: Using getAuthStatus(). Use AuthService.getAuthState() instead.');
  const state = AuthService.getAuthState();
  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user
  };
};
export const clearAuthState = AuthService.signOut.bind(AuthService);

// Export flag to indicate this is the deprecated version
export const USING_LEGACY_INITIALIZER = true;
