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
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';

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
 * Checks if a user has a specific permission
 * No caching or fallbacks - throws errors directly
 * 
 * @param userId User ID
 * @param permission Required permission
 * @returns Whether the user has the permission
 * @throws Error if permission check fails
 */
export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  if (!userId || isNaN(userId)) {
    throw authErrorHandler.createError(
      'Invalid user ID for permission check',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId, permission },
      400
    );
  }
  
  if (!permission) {
    throw authErrorHandler.createError(
      'Missing permission code for permission check',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId },
      400
    );
  }
  
  try {
    // Check with service directly - no caching
    const serviceFactory = getServiceFactory();
    const permissionService = serviceFactory.createPermissionService();
    
    if (!permissionService) {
      throw authErrorHandler.createError(
        'Permission service not available',
        AuthErrorType.PERMISSION_CHECK_FAILED,
        { userId, permission },
        500
      );
    }
    
    const result = await permissionService.hasPermission(userId, permission);
    
    // Log for debugging
    logger.debug('Permission check result', { 
      userId, 
      permission,
      hasPermission: result
    });
    
    return result;
  } catch (error) {
    // Convert all errors to standard format
    const permissionError = authErrorHandler.normalizeError(error, {
      operation: 'hasPermission',
      userId,
      permission
    });
    
    // Always throw the error - no fallbacks
    throw permissionError;
  }
}

/**
 * Invalidates the permission cache for a user
 * 
 * @param userId User ID
 */
export function invalidatePermissionCache(userId: number): void {
  if (!userId || isNaN(userId)) {
    throw authErrorHandler.createError(
      'Invalid user ID provided to invalidatePermissionCache',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId },
      400
    );
  }
  
  // Import dynamically to avoid circular dependencies
  import('@/features/permissions/lib/utils/permissionCacheUtils').then(module => {
    const { invalidateUserPermissionCache } = module;
    invalidateUserPermissionCache(userId);
    logger.debug(`Permission cache invalidated for user ${userId}`);
  }).catch(error => {
    logger.error('Error importing permissionCacheUtils', { error });
  });
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
 * @param request NextRequest with auth information
 * @param permission Required permission or array of permissions (any match)
 * @returns Permission check result
 */
export async function checkPermission(
  request: NextRequest | { auth?: { userId: number } },
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
      
      // Check each permission - throwing errors directly
      for (const perm of permission) {
        try {
          const hasPermResult = await hasPermission(userId, perm);
          permissionResults.push({ permission: perm, hasPermission: hasPermResult });
          
          if (hasPermResult) {
            return {
              success: true,
              permission: perm
            };
          }
        } catch (error) {
          // Log but continue trying other permissions
          permissionResults.push({ 
            permission: perm, 
            hasPermission: false, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
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
    const normalizedError = authErrorHandler.normalizeError(error, {
      operation: 'checkPermission',
      permission
    });
    
    // Return structured error result
    return {
      success: false,
      message: normalizedError.message,
      status: normalizedError.statusCode,
      error: {
        type: normalizedError.type,
        details: normalizedError.details
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
export async function withPermission(
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
      const normalizedError = authErrorHandler.normalizeError(error, {
        operation: 'withPermission',
        permission
      });
      
      return formatResponse.error(
        normalizedError.message,
        normalizedError.statusCode,
        {
          details: {
            errorType: normalizedError.type,
            permission
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
    const permissionError = authErrorHandler.normalizeError(error, {
      operation: 'isPermissionIncludedInRole',
      permission,
      role
    });
    
    // Always throw the error - no fallbacks
    throw permissionError;
  }
}

// Export the middleware as an object
export const permissionMiddleware = {
  hasPermission,
  checkPermission,
  withPermission,
  isPermissionIncludedInRole,
  invalidatePermissionCache,
  API_PERMISSIONS
};

// Default export for compatibility
export default permissionMiddleware;
