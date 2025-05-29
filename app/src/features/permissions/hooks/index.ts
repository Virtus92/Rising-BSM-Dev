// Export all permission hooks with clear naming

// Main permission hook with multiple export options for compatibility
export { 
  useEnhancedPermissions, 
  useEnhancedPermissions as usePermissions,
  default as usePermissionsDefault
} from './useEnhancedPermissions';

// Permission client for API operations
export { usePermissionClient } from './usePermissionClient';

// Re-export types if any hooks define them
export type { } from './useEnhancedPermissions';
