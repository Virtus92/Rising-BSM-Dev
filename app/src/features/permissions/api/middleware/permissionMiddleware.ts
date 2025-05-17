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
    MANAGE_PERMISSIONS: SystemPermission.USERS_MANAGE,
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
    CONVERT: SystemPermission.REQUESTS_CONVERT,
  },
  
  // Appointment management permissions
  APPOINTMENTS: {
    VIEW: SystemPermission.APPOINTMENTS_VIEW,
    CREATE: SystemPermission.APPOINTMENTS_CREATE,
    UPDATE: SystemPermission.APPOINTMENTS_EDIT,
    DELETE: SystemPermission.APPOINTMENTS_DELETE,
  },
  
  // Notification management permissions
  NOTIFICATIONS: {
    VIEW: SystemPermission.NOTIFICATIONS_VIEW,
    UPDATE: SystemPermission.NOTIFICATIONS_EDIT,
    DELETE: SystemPermission.NOTIFICATIONS_DELETE,
    MANAGE: SystemPermission.NOTIFICATIONS_MANAGE,
  },
  
  // Settings management permissions
  SETTINGS: {
    VIEW: SystemPermission.SETTINGS_VIEW,
    UPDATE: SystemPermission.SETTINGS_EDIT,
  },
  
  // System permissions
  SYSTEM: {
    ADMIN: SystemPermission.SYSTEM_ADMIN,
    LOGS: SystemPermission.SYSTEM_LOGS,
  },
};

/**
 * Cache configuration
 */
const CACHE_TTL_SECONDS = 300; // 5 minutes
const CACHE_ENABLED = process.env.DISABLE_PERMISSION_CACHE !== 'true';

/**
 * Checks if a user has a specific permission
 * 
 * This implementation uses direct service calls with proper error propagation
 * instead of timeout-based fallbacks.
 * 
 * @param userId User ID to check permissions for
 * @param permission Required permission code
 * @returns Promise resolving to whether the user has the permission
 * @throws Error if permission check fails
 */
export async function hasPermission(userId: number | undefined, permission: string): Promise<boolean> {
  // Input validation with proper error handling
  if (userId === undefined || userId === null) {
    logger.warn('Permission check attempted without valid user ID', { permission });
    
    // Fail definitively - auth required
    throw authErrorHandler.createError(
      'Authentication required',
      AuthErrorType.AUTH_REQUIRED,
      { permission },
      401
    );
  }
  
  if (isNaN(userId) || userId <= 0) {
    logger.error('Invalid user ID for permission check', { userId, permission });
    throw authErrorHandler.createError(
      'Invalid user ID for permission check',
      AuthErrorType.INVALID_USER_ID,
      { userId, permission },
      400
    );
  }
  
  if (!permission || typeof permission !== 'string') {
    throw authErrorHandler.createError(
      'Invalid permission code for permission check',
      AuthErrorType.INVALID_PERMISSION,
      { permission },
      400
    );
  }
  
  // Normalize permission code for consistent comparison
  const normalizedPermission = permission.trim().toLowerCase();
  
  try {
    // Check cache first if enabled
    if (CACHE_ENABLED) {
      try {
        // Import the cache utils directly
        const { getPermissionFromCache } = await import('@/features/permissions/lib/utils/permissionCacheUtils');
        
        // Get from cache with explicit typing
        const cachedResult = await getPermissionFromCache(userId, normalizedPermission);
        
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
        // Log cache error but continue to service check
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
      throw authErrorHandler.createError(
        'Permission service not available',
        AuthErrorType.SERVICE_UNAVAILABLE,
        { userId, permission: normalizedPermission },
        500
      );
    }
    
    // Check permission with the database service
    const hasPermissionResult = await permissionService.hasPermission(userId, normalizedPermission);
    
    // Store result in cache when enabled
    if (CACHE_ENABLED) {
      try {
        const { setPermissionInCache } = await import('@/features/permissions/lib/utils/permissionCacheUtils');
        await setPermissionInCache(userId, normalizedPermission, hasPermissionResult, CACHE_TTL_SECONDS);
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
    
    // Propagate errors with proper handling
    if (error && typeof error === 'object' && 'type' in error) {
      throw error; // Already a handled error
    }
    
    // Convert other errors to standard format
    throw authErrorHandler.createError(
      'Error checking permission',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { 
        userId, 
        permission: normalizedPermission,
        error: error instanceof Error ? error.message : String(error) 
      },
      500
    );
  }
}

/**
 * Invalidates the permission cache for a user
 * 
 * @param userId User ID
 * @returns Promise resolving to whether the operation was successful
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
    // Import dynamically to avoid circular dependencies
    const { invalidateUserPermissionCache } = await import('@/features/permissions/lib/utils/permissionCacheUtils');
    
    // Invalidate cache
    const result = await invalidateUserPermissionCache(userId);
    
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
 * 
 * Uses the centralized permission service with caching for efficient checks
 * 
 * @param request NextRequest with auth information
 * @param permission Required permission or array of permissions (any match)
 * @returns Permission check result
 */
export async function checkPermission(
  request: NextRequest | { auth?: { userId: number; name?: string } },
  permission: string | string[]
): Promise<PermissionCheckResult> {
  try {
    // Get user ID from auth
    const userId = request.auth?.userId;
    
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
          const hasPermResult = await hasPermission(userId, perm);
          return { permission: perm, hasPermission: hasPermResult };
        } catch (error) {
          // Log but continue with other permissions
          logger.warn(`Error checking permission ${perm}:`, {
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
      
      throw authErrorHandler.createPermissionError(
        `You don't have any of the required permissions: ${permissionStr}`,
        {
          userId,
          requiredPermissions: permission,
          permissionResults
        }
      );
    }
    
    // Check single permission
    const hasPermResult = await hasPermission(userId, permission);
    
    if (hasPermResult) {
      return {
        success: true,
        permission
      };
    }
    
    // Permission denied - throw error with details
    throw authErrorHandler.createPermissionError(
      `You don't have permission to perform this action (requires ${permission})`,
      {
        userId,
        requiredPermission: permission,
        permissionCheckResult: hasPermResult
      }
    );
  } catch (error) {
    // Convert error to PermissionCheckResult
    const normalizedError = authErrorHandler.normalizeError(error as Error) ;
    
    // Return structured error result
    return {
      success: false,
      message: normalizedError.message,
      error: {
        type: normalizedError.type,
      }
    };
  }
}

/**
 * Middleware to check if a user has a specific permission
 * 
 * @param handler Route handler function
 * @param permission Required permission or array of permissions
 * @returns Wrapped handler function with permission check
 */
export function withPermission(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  permission: string | string[]
) {
  // Return a direct function, not a Promise of a function
  return async function permissionHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    try {
      // Get user ID from auth
      const userId = request.auth?.userId;
      
      if (!userId) {
        return formatResponse.unauthorized('Authentication required', {
          details: {
            missingUserId: true,
            requiredPermission: permission
          }
        }.toString());
      }
      
      // If permission is an array, check each permission
      if (Array.isArray(permission)) {
        // Check each permission individually
        for (const perm of permission) {
          try {
            const hasPermResult = await hasPermission(userId, perm);
            
            if (hasPermResult) {
              // Permission granted, proceed to handler
              return handler(request, ...args);
            }
          } catch (error) {
            // Log but continue trying other permissions
            logger.warn(`Error checking permission ${perm}:`, {
              error: error instanceof Error ? error.message : String(error),
              userId,
              permission: perm
            });
          }
        }
        
        // No permissions matched, return error
        const permissionLabel = permission.join(' or ');
        
        return formatResponse.forbidden(`You don't have permission to perform this action (requires ${permissionLabel})`, {
          details: {
            userId,
            requiredPermissions: permission
          }
        }.toString());
      } else {
        // Check single permission directly - throw error if not granted
        const hasPermResult = await hasPermission(userId, permission);
        
        if (!hasPermResult) {
          return formatResponse.forbidden(`You don't have permission to perform this action (requires ${permission})`, {
            details: {
              userId,
              requiredPermission: permission
            }
          }.toString());
        }
        
        // User has permission, proceed to handler
        return handler(request, ...args);
      }
    } catch (error) {
      // Log error with context
      logger.error('Error in permission middleware', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requiredPermission: permission
      });
      
      // Format error response based on error type
      if (error instanceof PermissionError) {
        return formatResponse.forbidden(error.message, {
          details: {
            permission,
            errorType: error.errorCode
          }
        }.toString());
      }
      
      // Handle normal errors
      const normalizedError = authErrorHandler.normalizeError(error as Error);
      
      return formatResponse.error(
        normalizedError.message,
        normalizedError.status || 500,
        {
          details: {
            permission,
            errorType: normalizedError.type
          }
        }.toString()
      );
    }
  };
}

/**
 * Checks if a permission is included in a role's default permissions
 * 
 * @param permission Permission code to check
 * @param role User role
 * @returns Whether the permission is included
 * @throws Error if permission check fails
 */
export async function isPermissionIncludedInRole(permission: string, role: string): Promise<boolean> {
  try {
    // Admin role always has all permissions
    if (role?.toUpperCase() === 'ADMIN') {
      return true;
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
    
    // Get the default permissions for the role
    const rolePermissions = await permissionService.getDefaultPermissionsForRole(role);
    
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
 * 
 * @returns Permission cache statistics
 */
export async function getPermissionCacheStats(): Promise<any> {
  try {
    const { getPermissionCacheStats } = await import('@/features/permissions/lib/utils/permissionCacheUtils');
    return getPermissionCacheStats();
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
  withPermission,
  isPermissionIncludedInRole,
  invalidatePermissionCache,
  getPermissionCacheStats,
  API_PERMISSIONS
};

// Default export for compatibility
export default permissionMiddleware;
