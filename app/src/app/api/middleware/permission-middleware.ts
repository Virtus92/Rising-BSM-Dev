/**
 * Permission Middleware for App Router API
 * 
 * Adapter that connects the feature-level permission middleware to the app router.
 * Ensures consistent permission handling across the application.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Result of a permission check operation
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  permissionCode?: string;
  userId?: number;
  timestamp?: number;
}
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Check if user has the required permission
 * Wraps the feature-level permission middleware for app router API routes
 */
export async function withPermission(
  handler: (request: NextRequest, user: any, context?: any) => Promise<NextResponse>,
  requiredPermission: string | string[]
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Extract user from auth object (added by auth middleware)
      const auth = request.auth;
      
      // Handle different auth structures consistently
      // auth.userId (directly attached) or auth.user.id (nested user object)
      const userId = auth?.userId || auth?.user?.id || null;
      
      if (!userId) {
        logger.warn('Missing userId in auth object for permission check', {
          hasAuth: !!auth,
          authKeys: auth ? Object.keys(auth) : [],
          url: request.url
        });
        return formatResponse.unauthorized('Authentication required', 'User ID not found in request');
      }
      
      // Check permission using the core middleware
      let hasPermission = false;
      
      if (Array.isArray(requiredPermission)) {
        // Check if user has any of the required permissions
        for (const permission of requiredPermission) {
          const result = await permissionMiddleware.hasPermission(userId, permission);
          if (result) {
            hasPermission = true;
            break;
          }
        }
      } else {
        // Check single permission
        hasPermission = await permissionMiddleware.hasPermission(userId, requiredPermission);
      }
      
      if (!hasPermission) {
        const permissionLabel = Array.isArray(requiredPermission) 
          ? requiredPermission.join(' or ')
          : requiredPermission;
          
        return formatResponse.forbidden(`Insufficient permissions: ${permissionLabel}`);
      }
      
      // Permission granted, call the handler with context if provided
      return await handler(request, auth, context);
    } catch (error) {
      // Normalize error with auth error handler
      const normalizedError = authErrorHandler.normalizeError(error as Error);
      
      logger.error('Permission middleware error:', {
        error: normalizedError.message,
        type: normalizedError.type,
        userId: request.auth?.user?.id || null
      });
      
      return formatResponse.error(
        normalizedError.message,
        normalizedError.status || 500,
      );
    }
  };
}

/**
 * Check multiple permissions
 * Returns true if user has all specified permissions
 */
export async function checkMultiplePermissions(
  userId: number,
  permissions: string[],
  requireAll = true
): Promise<boolean> {
  try {
    if (!permissions || permissions.length === 0) {
      return true; // No permissions required
    }
    
    if (requireAll) {
      // Check that user has ALL permissions
      for (const permission of permissions) {
        const hasPermission = await permissionMiddleware.hasPermission(userId, permission);
        if (!hasPermission) {
          return false;
        }
      }
      return true;
    } else {
      // Check that user has ANY permission
      for (const permission of permissions) {
        const hasPermission = await permissionMiddleware.hasPermission(userId, permission);
        if (hasPermission) {
          return true;
        }
      }
      return false;
    }
  } catch (error) {
    logger.error('Error checking multiple permissions:', error as Error);
    return false;
  }
}

/**
 * Has specific permission
 * Directly checks if user has a specific permission
 */
export const hasPermission = permissionMiddleware.hasPermission;

// Export permission constants
export const API_PERMISSIONS = permissionMiddleware.API_PERMISSIONS;

// Default export
export default {
  withPermission,
  hasPermission,
  checkMultiplePermissions,
  API_PERMISSIONS
};
