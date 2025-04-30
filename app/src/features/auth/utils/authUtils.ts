'use client';

/**
 * Auth Utils - Re-export from lib/initialization/AuthInitializer
 * This file is kept for backwards compatibility only
 * New code should import directly from AuthInitializer
 */

import { 
  initializeAuth as setupAuth,
  isAuthInitialized,
  clearAuthState,
  getAuthStatus,
  isAuthenticated
} from '../lib/initialization/AuthInitializer';

// Re-export for backwards compatibility
export { setupAuth as initializeAuth, isAuthInitialized, clearAuthState, getAuthStatus, isAuthenticated };

export default {
  initializeAuth: setupAuth,
  isAuthInitialized,
  clearAuthState,
  getAuthStatus,
  isAuthenticated
};
