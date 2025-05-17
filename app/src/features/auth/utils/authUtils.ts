'use client';

/**
 * Auth Utils - Direct exports from AuthService
 * This provides the same auth utility functions but directly using AuthService
 */

import AuthService from '@/features/auth/core/AuthService';

// Export auth functions directly from AuthService
export const initializeAuth = AuthService.initialize.bind(AuthService);
export const isAuthInitialized = AuthService.isInitialized.bind(AuthService);
export const clearAuthState = AuthService.signOut.bind(AuthService);
export const isAuthenticated = AuthService.isAuthenticated.bind(AuthService);
export const getAuthStatus = () => {
  const state = AuthService.getAuthState();
  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user
  };
};

export default {
  initializeAuth,
  isAuthInitialized,
  clearAuthState,
  getAuthStatus,
  isAuthenticated
};
