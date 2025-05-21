/**
 * API route for checking user permissions
 * Uses strict error handling without fallbacks
 * Supports both GET and POST methods for individual and batch permission checks
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';
import permissionCache from '@/features/permissions/lib/utils/PermissionCache';

const logger = getLogger();

/**
 * GET /api/users/permissions/check?userId=123&permission=USERS_VIEW
 * Check if a user has a specific permission with strict error handling
 */
export const GET = routeHandler(async (req: NextRequest) => {
  // Get user ID and permission code from search params
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const permission = searchParams.get('permission');
  
  // Log headers for debugging
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID().substring(0, 8);
  logger.debug('Permission check request details:', {
    requestId,
    url: req.url,
    method: req.method,
    userId,
    permission,
    hasAuth: !!req.auth
  });
  
  // Validate input parameters
  if (!userId || isNaN(Number(userId))) {
    logger.warn('Invalid or missing user ID in permission check', {
      requestId,
      searchParams: Object.fromEntries(searchParams.entries())
    });
    
    throw authErrorHandler.createError(
      'Invalid or missing user ID',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { searchParams: Object.fromEntries(searchParams.entries()) }
    );
  }
  
  if (!permission) {
    throw authErrorHandler.createError(
      'Missing permission parameter',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId }
    );
  }
  
  // Normalize permission code for consistent handling
  const normalizedPermission = permission.toLowerCase().trim();

  // Extract the authenticated user ID from request
  let currentUserId = extractAuthenticatedUserId(req);
  
  // Require authentication
  if (!currentUserId) {
    logger.error('Authentication required for permission check API', {
      requestId,
      endpoint: '/api/users/permissions/check',
      userId: Number(userId),
      permission: normalizedPermission
    });
    
    throw authErrorHandler.createError(
      'Authentication required',
      AuthErrorType.AUTH_REQUIRED,
      { endpoint: '/api/users/permissions/check' }
    );
  }

  // Check cache for permission result
  const numUserId = Number(userId);
  const cachedCheck = permissionCache.getPermissionCheck(numUserId, normalizedPermission);
  
  if (cachedCheck !== undefined) {
    logger.debug('Permission check result from cache', {
      requestId,
      userId: numUserId,
      permission: normalizedPermission,
      result: cachedCheck
    });
    
    return formatResponse.success(cachedCheck, cachedCheck 
      ? `User has permission: ${normalizedPermission}` 
      : `User does not have permission: ${normalizedPermission}`
    );
  }

  // Create permission service
  const serviceFactory = getServiceFactory();
  const permissionService = serviceFactory.createPermissionService();
  
  try {
    // Check if user has the permission with timeout protection
    const permissionCheckPromise = permissionService.hasPermission(
      numUserId, 
      normalizedPermission,
      { context: { userId: currentUserId } }
    );
    
    // Add timeout to prevent hanging requests
    const hasPermission = await Promise.race([
      permissionCheckPromise,
      new Promise<boolean>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Permission check timed out for ${normalizedPermission}`));
        }, 5000); // 5 second timeout
      })
    ]);
    
    // Cache the result
    permissionCache.cachePermissionCheck(numUserId, normalizedPermission, hasPermission);
    
    // Log the check for audit purposes
    logger.debug('Permission check complete:', {
      requestId,
      userId: numUserId,
      permission: normalizedPermission,
      hasPermission,
      checkedBy: currentUserId
    });
    
    return formatResponse.success(hasPermission, hasPermission 
      ? `User has permission: ${normalizedPermission}` 
      : `User does not have permission: ${normalizedPermission}`
    );
  } catch (error) {
    // Convert to standard error format
    const permissionError = authErrorHandler.normalizeError(error as Error);
    
    // Log the error
    logger.error('Error checking user permission:', {
      requestId,
      error: permissionError,
      userId: numUserId,
      permission: normalizedPermission
    });
    
    // Throw the error to be handled by route handler
    throw permissionError;
  }
}, {
  requiresAuth: true
});

/**
 * POST /api/users/permissions/check
 * Batch check multiple permissions
 * Body format: { userId: number, permissions: string[] }
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID().substring(0, 8);
  logger.debug('Batch permission check request', {
    requestId,
    url: req.url,
    method: req.method
  });
  
  // Parse the request body
  let body: { userId?: number; permissions?: string[] };
  try {
    body = await req.json();
  } catch (error) {
    throw authErrorHandler.createError(
      'Invalid JSON in request body',
      AuthErrorType.PERMISSION_CHECK_FAILED
    );
  }
  
  const { userId, permissions } = body;
  
  // Validate input parameters
  if (!userId || isNaN(Number(userId))) {
    throw authErrorHandler.createError(
      'Invalid or missing user ID',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { body }
    );
  }
  
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    throw authErrorHandler.createError(
      'Missing or invalid permissions array',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId }
    );
  }
  
  // Extract the authenticated user ID from request
  let currentUserId = extractAuthenticatedUserId(req);
  
  // Require authentication
  if (!currentUserId) {
    logger.error('Authentication required for batch permission check API', {
      requestId,
      endpoint: '/api/users/permissions/check',
      userId,
      permissionsCount: permissions.length
    });
    
    throw authErrorHandler.createError(
      'Authentication required',
      AuthErrorType.AUTH_REQUIRED,
      { endpoint: '/api/users/permissions/check', method: 'POST' }
    );
  }

  // Create permission service
  const serviceFactory = getServiceFactory();
  const permissionService = serviceFactory.createPermissionService();
  const numUserId = Number(userId);
  
  try {
    // Check each permission, using cache where possible
    const permissionResults = await Promise.all(
      permissions.map(async (permission) => {
        const normalizedPermission = permission.toLowerCase().trim();
        
        // Check cache first
        const cachedCheck = permissionCache.getPermissionCheck(numUserId, normalizedPermission);
        if (cachedCheck !== undefined) {
          logger.debug('Using cached permission result for batch check', {
            requestId,
            userId: numUserId,
            permission: normalizedPermission,
            result: cachedCheck
          });
          
          return {
            permission: normalizedPermission,
            hasPermission: cachedCheck
          };
        }
        
        try {
          // Call permission service
          const hasPermission = await permissionService.hasPermission(
            numUserId,
            normalizedPermission,
            { context: { userId: currentUserId } }
          );
          
          // Cache the result
          permissionCache.cachePermissionCheck(numUserId, normalizedPermission, hasPermission);
          
          return {
            permission: normalizedPermission,
            hasPermission
          };
        } catch (error) {
          logger.error(`Error checking permission ${normalizedPermission}:`, {
            requestId,
            error: error instanceof Error ? error.message : String(error),
            userId: numUserId
          });
          
          // No fallbacks - throw the error
          throw error;
        }
      })
    );
    
    // Check if the user has ANY of the required permissions
    const hasAnyPermission = permissionResults.some(result => result.hasPermission);
    
    // Log results for audit
    logger.debug('Batch permission check results:', {
      requestId,
      userId: numUserId,
      requestedBy: currentUserId,
      permissionCount: permissions.length,
      hasAnyPermission
    });
    
    return formatResponse.success({
      hasPermission: hasAnyPermission,
      permissionResults
    });
  } catch (error) {
    // Convert to standard error format 
    const permissionError = authErrorHandler.normalizeError(error as Error);
    
    // Log the error
    logger.error('Error checking user permissions in batch:', {
      requestId,
      error: permissionError,
      userId: numUserId,
      permissions
    });
    
    // Throw the error to be handled by route handler
    throw permissionError;
  }
}, {
  requiresAuth: true
});

/**
 * Extract authenticated user ID from request using all available methods
 * @param req Request object
 * @returns User ID if authenticated, null otherwise
 */
function extractAuthenticatedUserId(req: NextRequest): number | null {
  // Method 1: Check req.auth from middleware (most reliable)
  if (req.auth?.userId) {
    return req.auth.userId;
  }
  
  // Method 2: Check X-Auth-User-ID header
  const userIdHeader = req.headers.get('X-Auth-User-ID');
  if (userIdHeader) {
    const userId = parseInt(userIdHeader, 10);
    if (!isNaN(userId) && userId > 0) {
      return userId;
    }
  }
  
  // Method 3: Check Authorization header directly
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      if (token && token.trim() !== '') {
        // Direct import to avoid circular dependencies
        const { jwtDecode } = require('jwt-decode');
        const decoded = jwtDecode(token) as {sub: string | number};
        const userId = typeof decoded.sub === 'number' ? 
          decoded.sub : parseInt(decoded.sub, 10);
        
        if (!isNaN(userId) && userId > 0) {
          return userId;
        }
      }
    } catch (error) {
      // Log but continue to other methods
      getLogger().warn('Failed to decode JWT from Authorization header', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return null;
}