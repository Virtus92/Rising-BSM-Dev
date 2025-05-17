/**
 * PermissionCacheInitializer - Compatibility file
 * 
 * This file maintains the same interface as the original PermissionCacheInitializer
 * but delegates to the new PermissionProvider system.
 * 
 * It serves as a compatibility layer to make migration easier.
 */

import { getLogger } from '@/core/logging';
import { clearPermissionCache } from './permissionCompatibility';

const logger = getLogger();

/**
 * Initialize the permission cache system (compatibility function)
 * This is a no-op in the new system since the PermissionProvider handles initialization
 */
export function initializePermissionCacheSystem(): void {
  logger.info('Permission cache system initialization requested (compatibility mode)');
  
  // The actual initialization is handled by the PermissionProvider
  // but we'll clear the cache just to be safe
  clearPermissionCache()
    .catch(error => {
      logger.error('Error clearing permission cache during initialization:', error);
    });
}

// No auto-initialization in compatibility layer
// The PermissionProvider now handles this

export default initializePermissionCacheSystem;