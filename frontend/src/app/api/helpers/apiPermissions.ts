/**
 * API Permissions Helper
 * 
 * Provides utilities for checking user permissions within API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { db } from '@/infrastructure/db';
import { SystemPermission, getPermissionsForRole } from '@/domain/enums/PermissionEnums';

// Cache for user permissions to reduce database queries
const permissionsCache: Map<number, { 
  permissions: string[]; 
  timestamp: number;
}> = new Map();

// Cache timeout in milliseconds (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Invalidates the permissions cache for a specific user
 * Should be called whenever a user's roles or permissions change
 * 
 * @param userId - User ID to invalidate cache for
 * @returns True if cache was invalidated, false if user wasn't in cache
 */
export async function invalidatePermissionCache(userId: number): Promise<boolean> {
  const logger = getLogger();
  
  if (permissionsCache.has(userId)) {
    permissionsCache.delete(userId);
    logger.debug(`Invalidated permissions cache for user ${userId}`);
    return true;
  }
  
  return false;
}

/**
 * Helper function to get user permissions from database
 * 
 * @param userId User ID
 * @returns Array of permission codes
 */
async function getUserPermissions(userId: number): Promise<string[]> {
  const logger = getLogger();
  
  // Check cache first
  const cached = permissionsCache.get(userId);
  if (cached && (Date.now() - cached.timestamp < CACHE_TIMEOUT)) {
    logger.debug(`Using cached permissions for user ${userId}`);
    return cached.permissions;
  }
  
  try {
    // Get user's role first to determine role-based permissions
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      logger.warn(`User with ID ${userId} not found when fetching permissions`);
      return [];
    }
    
    // Get role-based permissions
    const rolePermissions = getPermissionsForRole(user.role);
    
    // Get user-specific permissions from database
    const userSpecificPermissions = await db.userPermission.findMany({
      where: { userId },
      include: { permission: true }
    });
    
    // Extract permission codes from user-specific permissions
    const userPermissionCodes = userSpecificPermissions.map(up => up.permission.code);
    
    // Combine role permissions with user-specific permissions
    const permissions = [...new Set([...rolePermissions, ...userPermissionCodes])];
    
    // Update cache
    permissionsCache.set(userId, {
      permissions,
      timestamp: Date.now()
    });
    
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
  
  if (!userId) {
    logger.warn('Attempted permission check with invalid user ID');
    return false;
  }
  
  try {
    // Admin users bypass permission checks
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true }
    });
    
    // Make sure user exists and is active
    if (!user) {
      logger.warn(`User with ID ${userId} not found in permission check`);
      return false;
    }
    
    if (user.status !== 'active') {
      logger.warn(`User with ID ${userId} has status ${user.status} in permission check`);
      return false;
    }
    
    // Admin users always have all permissions (case-insensitive check)
    if (user.role.toLowerCase() === 'admin') {
      logger.debug(`Admin user ${userId} bypassing permission check for ${permission}`);
      return true;
    }
    
    // Get permissions for the user
    const permissions = await getUserPermissions(userId);
    
    // Check if user has the required permission
    const hasRequiredPermission = permissions.includes(permission);
    logger.debug(`Permission check for user ${userId}: ${permission} = ${hasRequiredPermission}`);
    return hasRequiredPermission;
  } catch (error) {
    logger.error('Error checking user permission:', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      permission
    });
    
    // Default to denying permission on error
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
      logger.warn('Permission check failed: No authentication data found');
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

export const apiPermissions = {
  hasPermission,
  withPermission,
  withAnyPermission,
  withAllPermissions,
  invalidatePermissionCache
};

export default apiPermissions;