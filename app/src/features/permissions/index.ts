/**
 * Permissions Feature Module
 * 
 * This file exports all permissions-related functionality
 */

// Re-export API functionality
export * from './api';

// Re-export domain entities and other modules
export * from './lib/entities';
// export * from './hooks';
// export * from './components';

// Re-export domain permission enums for convenience
export { 
  SystemPermission,
  PermissionCategory,
  PermissionAction,
  getPermissionsForRole
} from '@/domain/enums/PermissionEnums';
