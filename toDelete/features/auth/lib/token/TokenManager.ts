/**
 * DEPRECATED: This module has been replaced by the new auth system
 * 
 * All functionality has been moved to @/features/auth/core/TokenManager.ts
 */

import { AuthService } from '@/features/auth/core/AuthService';

// Compatibility layer for the old TokenManager
export const tokenManager = {
  getToken: () => AuthService.getToken(),
  validateToken: () => AuthService.validateToken(),
  refreshToken: () => AuthService.refreshToken(),
  isInitialized: () => AuthService.isInitialized(),
  // Additional compatibility methods
  clear: () => {
    if (AuthService.signOut) {
      return AuthService.signOut();
    }
    return Promise.resolve(false);
  }
};

export default tokenManager;
