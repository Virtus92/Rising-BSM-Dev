/**
 * DEPRECATED: This module has been replaced by the new auth system
 * 
 * All functionality has been moved to @/features/auth/core
 */

import { AuthService } from '@/features/auth/core/AuthService';

// Re-export as a compatibility layer
export const authService = AuthService;

// Export individual functions for legacy code
export const {
  initialize,
  getAuthState,
  isAuthenticated,
  getUser,
  getToken,
  validateToken,
  refreshToken,
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  verifyToken
} = AuthService;

export default AuthService;
