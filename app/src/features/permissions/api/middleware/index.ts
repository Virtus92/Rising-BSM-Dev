/**
 * Permissions Middleware exports
 * This file exports all permission middleware functionality
 */

// Import the actual implementation
import { 
  permissionMiddleware as permissionMiddlewareImpl,
  hasPermission,
  checkPermission,
  isPermissionIncludedInRole,
  invalidatePermissionCache,
  getPermissionCacheStats,
  API_PERMISSIONS,
  type PermissionCheckResult
} from './permissionMiddleware';

// Export the main permission middleware object
export const permissionMiddleware = permissionMiddlewareImpl;

// Export individual functions for direct use
export {
  hasPermission,
  checkPermission,
  isPermissionIncludedInRole,
  invalidatePermissionCache,
  getPermissionCacheStats,
  API_PERMISSIONS,
  type PermissionCheckResult
};

// Export client middleware for browser usage
export {
  API_PERMISSIONS as CLIENT_API_PERMISSIONS
} from './client';

// Re-export types
export type { PermissionCheckResult as ClientPermissionCheckResult } from './client';

// Default export for convenience
export default permissionMiddleware;
