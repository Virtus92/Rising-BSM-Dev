/**
 * API Middleware Index
 * 
 * Central export for all app-level API middleware
 * Fully integrated with AuthService as the single source of truth
 */

// Import and export auth middleware with types
import { 
  auth, 
  withAuth, 
  authenticateRequest,
  extractAuthToken,
  getUserFromRequest
} from '@/features/auth/api/middleware/authMiddleware';

export { 
  auth, 
  withAuth, 
  authenticateRequest,
  extractAuthToken,
  getUserFromRequest
};

export type {
  AuthOptions,
  AuthResult,
  AuthHandler
} from '@/features/auth/api/middleware/authMiddleware';

// Import and export permissionMiddleware properly
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
export { permissionMiddleware };

// Get cache functions from the correct location
import { 
  invalidateUserPermissionCache 
} from '@/features/permissions/lib/utils/permissionCacheUtils';

// Export with correct names
export { invalidateUserPermissionCache, invalidateUserPermissionCache as invalidatePermissionCache };

// The isPermissionIncludedInRole function implementation
export function isPermissionIncludedInRole(rolePermissions: string[], permissionCode: string): boolean {
  if (!Array.isArray(rolePermissions) || !permissionCode) return false;
  return rolePermissions.includes(permissionCode.toLowerCase());
}

// Export all as default
export default {
  auth: { 
    withAuth,
    authenticateRequest,
    extractAuthToken,
    getUserFromRequest
  },
  permission: { 
    permissionMiddleware
  }
};
