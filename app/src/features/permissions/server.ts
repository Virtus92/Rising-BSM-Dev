/**
 * Permissions Module - Server Only Exports
 * 
 * This file exports server-only permission functionality.
 * These exports should NEVER be imported by client components.
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

// Export middleware for API routes (server-only)
export {
  permissionMiddleware,
  type PermissionCheckResult,
  hasPermission,
  checkPermission,
  withPermission,
  isPermissionIncludedInRole,
  invalidatePermissionCache,
  getPermissionCacheStats,
  API_PERMISSIONS
} from './api/middleware/permissionMiddleware';

// Export requirePermission from the middleware (server-only)
export { 
  requirePermission,
  withPermission as withPermissionMiddleware,
  requireAnyPermission,
  requireAllPermissions,
  type PermissionOptions
} from './middleware/permissionMiddleware';

// Export server-side services if needed
export { PermissionService } from './lib/services/PermissionService';
export { PermissionRepository } from './lib/repositories/PermissionRepository';
