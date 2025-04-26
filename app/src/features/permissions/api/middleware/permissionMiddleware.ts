/**
 * API Permissions Helper
 * 
 * Provides utilities for checking user permissions within API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { db } from '@/core/db';
import { SystemPermission, getPermissionsForRole } from '@/domain/enums/PermissionEnums';

// Cache for user permissions to reduce database queries
const permissionsCache: Map<number, { 
  permissions: string[]; 
  timestamp: number;
}> = new Map();

// Cache timeout in milliseconds (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Valid user statuses that allow access
const ACTIVE_USER_STATUSES = ['active'];

/**
 * Invalidates the permissions cache for a specific user
 * Should be called whenever a user's roles or permissions change
 * 
 * @param userId - User ID to invalidate cache for
 * @returns True if cache was invalidated, false if user wasn't in cache
 */
export async function invalidatePermissionCache(userId: number): Promise<boolean> {
  const logger = getLogger();
  
  if (!userId || isNaN(userId) || userId <= 0) {
    logger.warn('Invalid user ID provided for cache invalidation', { userId });
    return false;
  }
  
  try {
    // Always return true if we're able to delete or if it wasn't in cache
    // This simplifies error handling for callers
    if (permissionsCache.has(userId)) {
      permissionsCache.delete(userId);
      logger.info(`Invalidated permissions cache for user ${userId}`);
    } else {
      logger.debug(`No cache entry found to invalidate for user ${userId}`);
    }
    
    return true;
  } catch (error) {
    logger.error('Error invalidating permissions cache:', { 
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack : undefined
    });
    // Don't throw so that the main operation can continue
    return false;
  }
}

/**
 * Helper function to get user permissions from database
 * 
 * @param userId User ID
 * @returns Array of permission codes
 */
async function getUserPermissions(userId: number): Promise<string[]> {
  const logger = getLogger();
  
  // Validate input
  if (!userId || isNaN(userId) || userId <= 0) {
    logger.warn('Invalid user ID provided for permission fetch', { userId });
    return [];
  }
  
  // Check cache first
  const cached = permissionsCache.get(userId);
  if (cached && (Date.now() - cached.timestamp < CACHE_TIMEOUT)) {
    logger.debug(`Using cached permissions for user ${userId}`);
    return cached.permissions;
  }
  
  try {
    // Get user with both role and status to ensure proper validation
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true }
    });
    
    if (!user) {
      logger.warn(`User with ID ${userId} not found when fetching permissions`);
      return [];
    }
    
    // Verify user status (only active users should have permissions)
    if (!ACTIVE_USER_STATUSES.includes(user.status)) {
      logger.warn(`User with ID ${userId} has inactive status ${user.status}, denying permissions`);
      return [];
    }
    
    // Get role-based permissions
    let rolePermissions: string[] = [];
    try {
      rolePermissions = getPermissionsForRole(user.role);
    } catch (roleError) {
      logger.error('Error getting role permissions:', {
        error: roleError instanceof Error ? roleError.message : String(roleError),
        role: user.role,
        userId
      });
      // Continue with empty role permissions rather than failing completely
    }
    
    // Get user-specific permissions from database
    let userPermissionCodes: string[] = [];
    try {
      const userSpecificPermissions = await db.userPermission.findMany({
        where: { userId },
        include: { permission: true }
      });
      
      // Extract permission codes from user-specific permissions
      userPermissionCodes = userSpecificPermissions
        .filter(up => up?.permission?.code) // Ensure we have valid permissions
        .map(up => up.permission.code);
    } catch (permError) {
      logger.error('Error fetching user-specific permissions:', {
        error: permError instanceof Error ? permError.message : String(permError),
        userId
      });
      // Continue with empty user-specific permissions rather than failing completely
    }
    
    // Combine role permissions with user-specific permissions
    const permissions = [...new Set([...rolePermissions, ...userPermissionCodes])];
    
    // Update cache with proper timestamp
    permissionsCache.set(userId, {
      permissions,
      timestamp: Date.now()
    });
    
    logger.debug(`Updated permissions cache for user ${userId} with ${permissions.length} permissions`);
    return permissions;
  } catch (error) {
    logger.error('Error fetching user permissions from database:', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    return [];
  }
}

/**
 * Checks if a user has the required permission
 * 
 * @param userId User ID
 * @param permission Permission code to check
 * @returns Boolean indicating if user has permission
 */
export async function hasPermission(
  userId: number,
  permission: SystemPermission | string
): Promise<boolean> {
  const logger = getLogger();
  
  // Validate inputs
  if (!userId || isNaN(userId) || userId <= 0) {
    logger.warn('Attempted permission check with invalid user ID', { userId });
    return false;
  }
  
  if (!permission || typeof permission !== 'string' || permission.trim() === '') {
    logger.warn('Attempted permission check with invalid permission', { permission });
    return false;
  }
  
  try {
    // Validate userId
    if (!userId || userId <= 0) {
      logger.warn('Invalid user ID for permission check', { userId });
      return false;
    }
    
    // Get user with role and status information
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true }
    });
    
    // Make sure user exists and is active
    if (!user) {
      logger.warn(`User with ID ${userId} not found in permission check`);
      return false;
    }
    
    // Check if user status allows access
    if (!ACTIVE_USER_STATUSES.includes(user.status)) {
      logger.warn(`User with ID ${userId} has status ${user.status} in permission check`);
      return false;
    }
    
    // Admin users always have all permissions (case-insensitive check)
    if (user.role.toLowerCase() === 'admin') {
      logger.debug(`Admin user ${userId} bypassing permission check for ${permission}`);
      return true;
    }
    
    // Get permissions for the user from cache or database
    const permissions = await getUserPermissions(userId);
    
    // Check if user has the required permission
    const hasRequiredPermission = permissions.includes(permission);
    logger.debug(`Permission check for user ${userId}: ${permission} = ${hasRequiredPermission}`);
    return hasRequiredPermission;
  } catch (error) {
    logger.error('Error checking user permission:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      permission
    });
    
    // Default to denying permission on error (fail closed for security)
    return false;
  }
}

/**
 * Middleware to check if user has required permission
 * 
 * @param handler API route handler
 * @param permission Required permission code
 * @returns Wrapped handler with permission check
 */
export function withPermission(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
  permission: SystemPermission | string
) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    const logger = getLogger();
    
    // Skip check if no auth data (should be caught by requiresAuth)
    if (!req.auth || !req.auth.userId) {
      logger.warn('Permission check failed: No authentication data found', { 
        url: req.nextUrl.pathname,
        method: req.method,
        requiredPermission: permission
      });
      return formatResponse.error('Authentication required', 401);
    }
    
    // Skip permission check in development if bypass header is set
    if (process.env.NODE_ENV !== 'production' && 
        req.headers.get('x-bypass-permission-check') === 'true') {
      logger.warn(`Permission check bypassed for ${permission} in development mode`);
      return handler(req, params);
    }
    
    // Check if user has the required permission
    const userHasPermission = await hasPermission(req.auth.userId, permission);
    
    if (!userHasPermission) {
      logger.warn(`Permission denied: User ${req.auth.userId} does not have permission ${permission}`);
      return formatResponse.error(
        `You don't have permission to perform this action (requires ${permission})`, 
        403
      );
    }
    
    // User has permission, proceed with handler
    return handler(req, params);
  };
}

/**
 * Middleware to check if user has any of the required permissions
 * 
 * @param handler API route handler
 * @param permissions Array of required permission codes (any one is sufficient)
 * @returns Wrapped handler with permission check
 */
export function withAnyPermission(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
  permissions: (SystemPermission | string)[]
) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    const logger = getLogger();
    
    // Skip check if no auth data (should be caught by requiresAuth)
    if (!req.auth || !req.auth.userId) {
      logger.warn('Permission check failed: No authentication data found');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Skip permission check in development if bypass header is set
    if (process.env.NODE_ENV !== 'production' && 
        req.headers.get('x-bypass-permission-check') === 'true') {
      logger.warn(`Permission check bypassed for any of [${permissions.join(', ')}] in development mode`);
      return handler(req, params);
    }
    
    // Admin users bypass permission checks
    const user = await db.user.findUnique({
      where: { id: req.auth.userId },
      select: { role: true }
    });
    
    if (user?.role === 'admin') {
      logger.debug(`Admin user ${req.auth.userId} bypassing permission check`);
      return handler(req, params);
    }
    
    // Get permissions for the user
    const userPermissions = await getUserPermissions(req.auth.userId);
    
    // Check if user has any of the required permissions
    const hasAnyRequiredPermission = permissions.some(
      permission => userPermissions.includes(permission)
    );
    
    if (!hasAnyRequiredPermission) {
      logger.warn(`Permission denied: User ${req.auth.userId} does not have any of required permissions [${permissions.join(', ')}]`);
      return formatResponse.error(
        `You don't have permission to perform this action (requires any of [${permissions.join(', ')}])`, 
        403
      );
    }
    
    // User has at least one required permission, proceed with handler
    return handler(req, params);
  };
}

/**
 * Middleware to check if user has all of the required permissions
 * 
 * @param handler API route handler
 * @param permissions Array of required permission codes (all are required)
 * @returns Wrapped handler with permission check
 */
export function withAllPermissions(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>,
  permissions: (SystemPermission | string)[]
) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    const logger = getLogger();
    
    // Skip check if no auth data (should be caught by requiresAuth)
    if (!req.auth || !req.auth.userId) {
      logger.warn('Permission check failed: No authentication data found');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Skip permission check in development if bypass header is set
    if (process.env.NODE_ENV !== 'production' && 
        req.headers.get('x-bypass-permission-check') === 'true') {
      logger.warn(`Permission check bypassed for all of [${permissions.join(', ')}] in development mode`);
      return handler(req, params);
    }
    
    // Admin users bypass permission checks
    const user = await db.user.findUnique({
      where: { id: req.auth.userId },
      select: { role: true }
    });
    
    if (user?.role === 'admin') {
      logger.debug(`Admin user ${req.auth.userId} bypassing permission check`);
      return handler(req, params);
    }
    
    // Get permissions for the user
    const userPermissions = await getUserPermissions(req.auth.userId);
    
    // Check if user has all of the required permissions
    const hasAllRequiredPermissions = permissions.every(
      permission => userPermissions.includes(permission)
    );
    
    if (!hasAllRequiredPermissions) {
      logger.warn(`Permission denied: User ${req.auth.userId} does not have all required permissions [${permissions.join(', ')}]`);
      return formatResponse.error(
        `You don't have permission to perform this action (requires all of [${permissions.join(', ')}])`, 
        403
      );
    }
    
    // User has all required permissions, proceed with handler
    return handler(req, params);
  };
}

/**
 * Standalone function to check permissions for API routes
 * 
 * @param request - The request object
 * @param permissions - Array of required permissions (any one is sufficient)
 * @returns Object with success flag and message/status if failed
 */
export async function checkPermission(
  request: Request, 
  permissions: (SystemPermission | string)[]
) {
  const logger = getLogger();
  
  try {
    // Extract userId from request headers or auth token
    // This is a simplified approach - in a real app you'd use your auth middleware
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        message: 'Authentication required',
        status: 401
      };
    }
    
    // Extract user ID from token
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      if (!decoded || !decoded.sub) {
        return {
          success: false,
          message: 'Invalid token format',
          status: 401
        };
      }
      
      const userId = Number(decoded.sub);
      
      // Admin users bypass permission checks
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true }
      });
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          status: 404
        };
      }
      
      if (!ACTIVE_USER_STATUSES.includes(user.status)) {
        return {
          success: false,
          message: 'User account is not active',
          status: 403
        };
      }
      
      // Admin role bypasses permission checks
      if (user.role.toLowerCase() === 'admin') {
        return { success: true };
      }
      
      // Get user permissions
      const userPermissions = await getUserPermissions(userId);
      
      // Check if user has any of the required permissions
      const hasAnyRequiredPermission = permissions.some(
        permission => userPermissions.includes(permission)
      );
      
      if (!hasAnyRequiredPermission) {
        return {
          success: false,
          message: `You don't have permission to perform this action (requires any of [${permissions.join(', ')}])`,
          status: 403
        };
      }
      
      // User has at least one required permission
      return { success: true };
    } catch (jwtError) {
      logger.warn('JWT verification failed in checkPermission', { 
        error: jwtError instanceof Error ? jwtError.message : String(jwtError)
      });
      
      return {
        success: false,
        message: 'Invalid or expired token',
        status: 401
      };
    }
  } catch (error) {
    logger.error('Error in checkPermission', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return {
      success: false,
      message: 'Error checking permissions',
      status: 500
    };
  }
}

export const permissionMiddleware = {
  hasPermission,
  withPermission,
  withAnyPermission,
  withAllPermissions,
  invalidatePermissionCache,
  checkPermission
};

export default permissionMiddleware;