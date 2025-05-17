'use client';

/**
 * TokenService.ts
 * 
 * DEPRECATED: This file exists only for compatibility with code that hasn't been migrated yet.
 * All functionality is forwarded to AuthService, which is the single source of truth.
 * 
 * This file should be moved to /toDelete once all references have been updated.
 */

import { getLogger } from '@/core/logging';
import { AuthService } from '@/features/auth/core/AuthService';

// Logger
const logger = getLogger();

// Log deprecation warning
if (process.env.NODE_ENV !== 'production') {
  logger.warn(
    'TokenService is deprecated and will be removed. Use AuthService directly instead.'
  );
}

/**
 * Compatibility layer for backward compatibility
 */
export const tokenService = {
  // Token retrieval
  getToken: async () => AuthService.getToken(),
  getTokenInfo: async () => AuthService.getTokenInfo(),
  
  // Token validation
  validateToken: async () => AuthService.validateToken(),
  verifyToken: async (token: string) => AuthService.verifyToken(token),
  
  // Token refresh
  refreshToken: async () => {
    const result = await AuthService.refreshToken();
    return result.success;
  },
  
  // Token events
  onTokenExpiring: (callback: () => void) => AuthService.onTokenExpiring(callback),
  onTokenRefreshed: (callback: () => void) => AuthService.onTokenRefreshed(callback),
  
  // Token cleanup
  clearTokens: () => AuthService.clearTokens(),
};

// Default export
export default tokenService;
