/**
 * Permissions Module
 * 
 * Clean implementation of the permission system with proper exports.
 * No fallbacks, compatibility layers, or workarounds.
 */

// Export from providers
export { 
  PermissionProvider,
  usePermissions,
  usePermission,
  useAllPermissions,
  useAnyPermission,
  type Permission,
  type PermissionContextValue
} from './providers/PermissionProvider';

// Export from client
export { 
  PermissionClient, 
  PermissionClientError 
} from './lib/clients/PermissionClient';

// Export basic utilities
export {
  getPermissionFromCache,
  setPermissionInCache,
  invalidateUserPermissionCache,
  clearPermissionCache,
  getPermissionCacheStats
} from './lib/utils/permissionCacheUtils';

// Export middleware for API routes
export {
  permissionMiddleware,
  type PermissionCheckResult
} from './api/middleware/permissionMiddleware';

// Export requirePermission from the middleware
export { requirePermission } from './middleware/permissionMiddleware';

// Re-export PermissionProvider as default export
import { PermissionProvider as Provider } from './providers/PermissionProvider';
export default Provider;
