'use client';

/**
 * Authentication Utilities
 * 
 * This file re-exports the authentication initialization and utility functions from AuthInitializer.ts
 * to provide a simpler, more convenient interface.
 * 
 * Note: All functionality has been moved to AuthInitializer.ts to prevent duplication.
 * This file serves as a central entry point for auth-related utilities.
 */

import { 
  initializeAuth, 
  isAuthInitialized, 
  getAuthStatus, 
  resetAuthInitialization, 
  clearAuthState,
  setupAuth,
  isAuthenticated,
  getUserFromToken as getUserFromAuthToken
} from '../lib/initialization/AuthInitializer';

export { 
  initializeAuth, 
  isAuthInitialized, 
  getAuthStatus, 
  resetAuthInitialization, 
  clearAuthState,
  setupAuth,
  isAuthenticated,
  getUserFromAuthToken
};

export default {
  initializeAuth,
  isAuthInitialized,
  getAuthStatus,
  resetAuthInitialization,
  clearAuthState,
  setupAuth,
  isAuthenticated,
  getUserFromAuthToken
};