/**
 * Permissions Module - Client Safe Exports Only
 * 
 * This file exports only client-safe permission functionality.
 * Server-only middleware and utilities are exported separately.
 */

// Export from providers (client-safe)
export { 
  PermissionProvider,
  usePermissions as usePermissionsProvider,
  usePermission,
  useAllPermissions,
  useAnyPermission,
  type Permission,
  type PermissionContextValue
} from './providers/PermissionProvider';

// Export from client (client-safe)
export { 
  PermissionClient, 
  PermissionClientError 
} from './lib/clients/PermissionClient';

// Export basic utilities (client-safe)
export {
  getPermissionFromCache,
  setPermissionInCache,
  invalidateUserPermissionCache,
  clearPermissionCache,
  getPermissionCacheStats
} from './lib/utils/permissionCacheUtils';

// Export from hooks for compatibility (main export)
export { 
  useEnhancedPermissions,
  useEnhancedPermissions as usePermissions, // Primary export for client usage
  usePermissionClient
} from './hooks';

// Re-export PermissionProvider as default export
import { PermissionProvider as Provider } from './providers/PermissionProvider';
export default Provider;

// NOTE: Server-only middleware and utilities are exported from './server'
// Import server-only functionality like this:
// import { permissionMiddleware } from '@/features/permissions/server'
