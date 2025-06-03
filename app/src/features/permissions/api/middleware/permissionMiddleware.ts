/**
 * Permission Middleware
 * Provides utilities for checking and enforcing permissions with robust error reporting
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { PermissionError } from '@/core/errors/types/AppError';
import { authErrorHandler } from '@/features/auth/utils/AuthErrorHandler.server';
import { AuthErrorType } from '@/types/types/auth';

const logger = getLogger();

/**
 * Permission code constants for API endpoints
 * All permissions are properly defined (no substitutions)
 */
export const API_PERMISSIONS = {
  // User management permissions
  USERS: {
    VIEW: SystemPermission.USERS_VIEW,
    CREATE: SystemPermission.USERS_CREATE,
    UPDATE: SystemPermission.USERS_EDIT,
    DELETE: SystemPermission.USERS_DELETE,
  },
  
  // Customer management permissions
  CUSTOMERS: {
    VIEW: SystemPermission.CUSTOMERS_VIEW,
    CREATE: SystemPermission.CUSTOMERS_CREATE,
    UPDATE: SystemPermission.CUSTOMERS_EDIT,
    DELETE: SystemPermission.CUSTOMERS_DELETE,
  },
  
  // Request management permissions
  REQUESTS: {
    VIEW: SystemPermission.REQUESTS_VIEW,
    CREATE: SystemPermission.REQUESTS_CREATE,
    UPDATE: SystemPermission.REQUESTS_EDIT,
    DELETE: SystemPermission.REQUESTS_DELETE,
    ASSIGN: SystemPermission.REQUESTS_ASSIGN,
    APPROVE: SystemPermission.REQUESTS_APPROVE,
    REJECT: SystemPermission.REQUESTS_REJECT,
    CONVERT: SystemPermission.REQUESTS_CONVERT,
  },
  
  // Appointment management permissions
  APPOINTMENTS: {
    VIEW: SystemPermission.APPOINTMENTS_VIEW,
    CREATE: SystemPermission.APPOINTMENTS_CREATE,
    UPDATE: SystemPermission.APPOINTMENTS_EDIT,
    DELETE: SystemPermission.APPOINTMENTS_DELETE,
  },
  
  // Notification management permission
  NOTIFICATIONS: {
    VIEW: SystemPermission.NOTIFICATIONS_VIEW,
  },
  
  // Settings management permissions
  SETTINGS: {
    VIEW: SystemPermission.SETTINGS_VIEW,
    UPDATE: SystemPermission.SETTINGS_EDIT,
  },

  // Permission management
  PERMISSIONS: {
    VIEW: SystemPermission.PERMISSIONS_VIEW,
    MANAGE: SystemPermission.PERMISSIONS_MANAGE,
  },
};

/**
 * Cache configuration
 */
const CACHE_TTL_SECONDS = 300; // 5 minutes
const CACHE_ENABLED = process.env.DISABLE_PERMISSION_CACHE !== 'true';

// Using dynamic import with client-safe approach
const getPermissionCacheUtil = async () => {
return import('@/features/permissions/lib/utils/permissionCacheUtils')
 .then(module => ({
   getPermissionFromCache: module.getPermissionFromCache,
   setPermissionInCache: module.setPermissionInCache,
   invalidateUserPermissionCache: module.invalidateUserPermissionCache,
   getPermissionCacheStats: module.getPermissionCacheStats
 }))
 .catch(error => {
   logger.error('Failed to import permission cache utils', { error });
    return {
    getPermissionFromCache: async () => undefined,
    setPermissionInCache: async () => false,
  invalidateUserPermissionCache: async () => false,
  getPermissionCacheStats: () => ({})
};
});
};

/**
* Checks if a user has a specific permission
* Direct database check with proper error handling - NO FALLBACKS
*/
export async function hasPermission(userId: number | undefined, permission: string, role?: string): Promise<boolean> {
  // Input validation with proper error handling
  if (userId === undefined || userId === null) {
    logger.warn('Permission check attempted without valid user ID', { permission });
    return false; // No user ID means no permission
  }

  if (isNaN(userId) || userId <= 0) {
    logger.error('Invalid user ID for permission check', { userId, permission });
    return false; // Invalid user ID means no permission
  }

  if (!permission || typeof permission !== 'string') {
    logger.error('Invalid permission code for permission check', { 
      permission,
      permissionType: typeof permission,
      userId,
      stack: new Error().stack
    });
    return false; // Invalid permission means deny access
  }
  
  // Early admin role bypass - admins have all permissions
  if (role && role.toLowerCase() === 'admin') {
    logger.info(`Admin user ${userId} granted permission: ${permission}`, { userId, role, permission });
    return true;
  }

  // Normalize permission code for consistent comparison
  const normalizedPermission = permission.trim().toLowerCase();

  try {
    // Check cache first if enabled
    if (CACHE_ENABLED) {
      try {
        // Import the cache utils safely
        const cacheUtils = await getPermissionCacheUtil();

        // Get from cache with explicit typing
        const cachedResult = await cacheUtils.getPermissionFromCache(userId, normalizedPermission);

        // Return early if we have a cached result
        if (cachedResult !== undefined) {
          logger.debug('Permission check result from cache', { 
            userId, 
            permission: normalizedPermission,
            result: cachedResult
          });
          return cachedResult;
        }
      } catch (cacheError) {
        // Log cache error but continue to database check
        logger.warn('Permission cache lookup failed', { 
          userId, 
          permission: normalizedPermission,
          error: cacheError instanceof Error ? cacheError.message : String(cacheError) 
        });
      }
    }
    
    // Get permission service
    const serviceFactory = getServiceFactory();
    const permissionService = serviceFactory.createPermissionService();
    
    if (!permissionService) {
      logger.error('Permission service not available', { userId, permission: normalizedPermission });
      return false; // No service means deny by default (secure approach)
    }
    
    // Log permission check for debugging
    logger.debug(`Checking permission ${normalizedPermission} for user ${userId}`, {
      userId,
      permission: normalizedPermission,
      source: 'database'
    });
    
    // Check permission with the database service - no fallbacks
    const hasPermissionResult = await permissionService.hasPermission(userId, normalizedPermission);
    
    // Store result in cache when enabled
    if (CACHE_ENABLED) {
      try {
        // Import the cache utils safely
        const cacheUtils = await getPermissionCacheUtil();
        await cacheUtils.setPermissionInCache(userId, normalizedPermission, hasPermissionResult, CACHE_TTL_SECONDS);
      } catch (cacheError) {
        // Log cache error but don't fail the permission check
        logger.warn('Failed to cache permission result', { 
          userId, 
          permission: normalizedPermission,
          error: cacheError instanceof Error ? cacheError.message : String(cacheError)
        });
      }
    }
    
    return hasPermissionResult;
  } catch (error) {
    // Log the error but don't throw
    logger.error('Error in permission check', { 
      userId, 
      permission: normalizedPermission,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
    });
    
    // For security, any error means denying permission
    return false;
  }
}

/**
 * Invalidates the permission cache for a user
 */
export async function invalidatePermissionCache(userId: number): Promise<boolean> {
  if (!userId || isNaN(userId)) {
    throw authErrorHandler.createError(
      'Invalid user ID provided to invalidatePermissionCache',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId },
      400
    );
  }
  
  try {
    // Import safely with error handling
    const cacheUtils = await getPermissionCacheUtil();
    
    // Invalidate cache
    const result = await cacheUtils.invalidateUserPermissionCache(userId);
    
    if (result) {
      logger.info(`Permission cache invalidated for user ${userId}`);
    } else {
      logger.warn(`Failed to invalidate permission cache for user ${userId}`);
    }
    
    return result;
  } catch (error) {
    logger.error('Error invalidating permission cache', { 
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return false instead of throwing to avoid breaking callers
    return false;
  }
}

/**
 * Permission check result with detailed information
 */
export interface PermissionCheckResult {
  /** Whether the check was successful */
  success: boolean;
  
  /** Error message (if unsuccessful) */
  message?: string;
  
  /** HTTP status code */
  status?: number;
  
  /** Permission that was checked */
  permission?: string;
  
  /** Error details (if any) */
  error?: any;
}

/**
 * Checks if a user has a specific permission and returns a structured result
 * With improved error handling and no thrown errors
 * 
 * Uses the centralized permission service with caching for efficient checks
 * 
 * @param request NextRequest with auth information
 * @param permission Required permission or array of permissions (any match)
 * @returns Permission check result
 */
export async function checkPermission(
  request: NextRequest | { auth?: { userId: number; name?: string; role: string; } },
  permission: string | string[]
): Promise<PermissionCheckResult> {
  try {
    // Get user ID from auth
    const userId = request.auth?.userId;
    const role = request.auth?.role;
    
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
        status: 401,
        error: {
          type: AuthErrorType.AUTH_REQUIRED,
          noAuth: true
        }
      };
    }
    
    // If array of permissions, check if user has any of them
    if (Array.isArray(permission)) {
      // Track all permission check attempts for detailed error reporting
      const permissionResults: { permission: string; hasPermission: boolean; error?: any }[] = [];
      
      // Check permissions in parallel (with individual error handling)
      const checkPromises = permission.map(async (perm) => {
        try {
          // Our improved hasPermission never throws, so this is safer now
          const hasPermResult = await hasPermission(userId, perm, request.auth?.role);
          return { permission: perm, hasPermission: hasPermResult };
        } catch (error) {
          // This shouldn't happen anymore, but handle it just in case
          logger.warn(`Unexpected error checking permission ${perm}:`, {
            error: error instanceof Error ? error.message : String(error),
            userId,
            perm
          });
          return { 
            permission: perm, 
            hasPermission: false, 
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
      
      // Wait for all checks to complete
      const results = await Promise.all(checkPromises);
      
      // Track results for error reporting
      permissionResults.push(...results);
      
      // Check if any permission is granted
      const grantedPermission = results.find(result => result.hasPermission);
      
      if (grantedPermission) {
        return {
          success: true,
          permission: grantedPermission.permission
        };
      }
      
      // No permissions matched - provide detailed diagnostic information
      const permissionStr = permission.join(', ');
      
      // Return a structured result instead of throwing
      return {
        success: false,
        message: `You don't have any of the required permissions: ${permissionStr}`,
        status: 403,
        permission: permissionStr,
        error: {
          type: AuthErrorType.PERMISSION_DENIED,
          details: {
            userId,
            requiredPermissions: permission,
            permissionResults
          }
        }
      };
    }
    
    // Check single permission - our new implementation never throws
    const hasPermResult = await hasPermission(userId, permission, request.auth?.role);
    
    if (hasPermResult) {
      return {
        success: true,
        permission
      };
    }
    
    // Permission denied - return structured result with details
    return {
      success: false,
      message: `You don't have permission to perform this action (requires ${permission})`,
      status: 403,
      permission,
      error: {
        type: AuthErrorType.PERMISSION_DENIED,
        details: {
          userId,
          requiredPermission: permission
        }
      }
    };
  } catch (error) {
    // This should never happen with our improved implementation,
    // but handle unexpected errors gracefully
    logger.error('Unexpected error in checkPermission', {
      userId: request.auth?.userId,
      permission,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    });
    
    // Return structured error result
    return {
      success: false,
      message: 'An error occurred while checking permissions',
      status: 500,
      error: {
        type: AuthErrorType.PERMISSION_CHECK_FAILED,
        details: { permission }
      }
    };
  }
}

/**
 * Checks if a permission is included in a role's defined permissions
 * Direct database check with no fallbacks
 * 
 * @param permission Permission code to check
 * @param role User role
 * @returns Whether the permission is included
 * @throws Error if permission check fails
 */
export async function isPermissionIncludedInRole(permission: string, role?: string): Promise<boolean> {
  try {
    // Validation checks
    if (!permission) {
      throw authErrorHandler.createError(
        'Permission code is required',
        AuthErrorType.INVALID_REQUEST,
        { permission },
        400
      );
    }

    if (!role) {
      throw authErrorHandler.createError(
        'Role is required for permission check',
        AuthErrorType.INVALID_REQUEST,
        { role },
        400
      );
    }
    
    // Get role permissions from service
    const serviceFactory = getServiceFactory();
    const permissionService = serviceFactory.createPermissionService();
    
    if (!permissionService) {
      throw authErrorHandler.createError(
        'Permission service not available',
        AuthErrorType.PERMISSION_CHECK_FAILED,
        { permission, role },
        500
      );
    }
    
    // Get the permissions for the role - direct database check 
    const rolePermissions = await permissionService.getRolePermissions(role.toLowerCase());
    
    // Check if the permission is included
    return rolePermissions.includes(permission);
  } catch (error) {
    // Convert to standard error format
    const permissionError = authErrorHandler.normalizeError(error as Error);
    
    // Always throw the error - no fallbacks
    throw permissionError;
  }
}

/**
 * Get cache statistics
 */
export async function getPermissionCacheStats(): Promise<any> {
  try {
    const cacheUtils = await getPermissionCacheUtil();
    return cacheUtils.getPermissionCacheStats();
  } catch (error) {
    logger.error('Error getting permission cache stats', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Export the middleware as an object
export const permissionMiddleware = {
  hasPermission,
  checkPermission,
  isPermissionIncludedInRole,
  invalidatePermissionCache,
  getPermissionCacheStats,
  API_PERMISSIONS
};

// Default export for compatibility
export default permissionMiddleware;
