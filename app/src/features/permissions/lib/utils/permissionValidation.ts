/**
 * Permission Validation Utilities
 * 
 * Provides validation functions to ensure permission constants
 * are properly defined and used throughout the application.
 */
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';
import { SystemPermissionMap } from '@/domain/permissions/SystemPermissionMap';

const logger = getLogger();

/**
 * Validates that all system permissions are properly defined in the SystemPermissionMap
 * This helps catch inconsistencies in permission definitions
 */
export function validatePermissionMapCompleteness(): void {
  const allEnumPermissions = Object.values(SystemPermission);
  const definedMappings = Object.keys(SystemPermissionMap);
  
  // Check if any permissions are missing from the map
  const missingMappings = allEnumPermissions.filter(
    permission => !definedMappings.includes(permission)
  );
  
  if (missingMappings.length > 0) {
    logger.warn('Permission constants missing from SystemPermissionMap', {
      missingMappings
    });
  }
  
  // Check if there are any mappings for non-existent permissions
  const extraMappings = definedMappings.filter(
    mapping => !allEnumPermissions.includes(mapping as any)
  );
  
  if (extraMappings.length > 0) {
    logger.warn('SystemPermissionMap contains definitions for non-existent permissions', {
      extraMappings
    });
  }
}

/**
 * Validates permission constants used in routing code
 * Logs warnings for any references to undefined permissions
 */
export function validateRoutePermissions(routePermissions: string[]): void {
  const allPermissions = Object.values(SystemPermission);
  
  // Find any route permissions that aren't defined in the SystemPermission enum
  const undefinedPermissions = routePermissions.filter(
    permission => !allPermissions.includes(permission as any)
  );
  
  if (undefinedPermissions.length > 0) {
    logger.error('Routes are using undefined permission constants', {
      undefinedPermissions
    });
  }
}

/**
 * Run all permission validation checks
 */
export function validateAllPermissions(): void {
  try {
    // Validate permission map completeness
    validatePermissionMapCompleteness();
    
    // Additional validations can be added here
    logger.info('Permission validation completed');
  } catch (error) {
    logger.error('Error validating permissions', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export default {
  validatePermissionMapCompleteness,
  validateRoutePermissions,
  validateAllPermissions
};
