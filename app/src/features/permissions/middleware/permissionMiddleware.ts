/**
 * Clean Permission Middleware - Server Only
 * 
 * Design principles:
 * 1. Direct permission checks - no cache
 * 2. Clear error responses
 * 3. Integration with auth middleware
 * 4. Type-safe permission checks
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getUserFromRequest } from '@/features/auth/api/middleware/authMiddleware';
import { getPermissionService } from '@/core/factories/serviceFactory.server';

const logger = getLogger();

/**
 * Permission middleware options
 */
export interface PermissionOptions {
  permissions: SystemPermission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission.
}

/**
 * Permission middleware
 */
export function withPermission(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: PermissionOptions
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Get authenticated user from request
      const user = await getUserFromRequest(request);
      
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: 'Authentication required',
          },
          { status: 401 }
        );
      }
      
      // Get permission service
      const permissionService = getPermissionService();
      
      // Check permissions
      let hasPermission = false;
      
      if (options.requireAll) {
        // Check if user has all required permissions
        hasPermission = true;
        for (const permission of options.permissions) {
          const hasThisPermission = await permissionService.hasPermission(user.id, permission);
          if (!hasThisPermission) {
            hasPermission = false;
            break;
          }
        }
      } else {
        // Check if user has any required permission
        hasPermission = false;
        for (const permission of options.permissions) {
          const hasThisPermission = await permissionService.hasPermission(user.id, permission);
          if (hasThisPermission) {
            hasPermission = true;
            break;
          }
        }
      }
      
      if (!hasPermission) {
        const permissionList = options.permissions.join(', ');
        const requirement = options.requireAll ? 'all' : 'any';
        
        logger.warn('Permission denied', {
          userId: user.id,
          permissions: options.permissions,
          requireAll: options.requireAll,
        });
        
        return NextResponse.json(
          {
            success: false,
            message: `You need ${requirement} of the following permissions: ${permissionList}`,
          },
          { status: 403 }
        );
      }
      
      // Permission granted, continue to handler
      return handler(request, context);
    } catch (error) {
      logger.error('Permission middleware error:', error as Error);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Permission check failed',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Create permission guard for specific permission
 */
export function requirePermission(permission: SystemPermission) {
  return (handler: (request: NextRequest, context?: any) => Promise<NextResponse>) => {
    return withPermission(handler, {
      permissions: [permission],
      requireAll: true,
    });
  };
}

/**
 * Create permission guard for any of multiple permissions
 */
export function requireAnyPermission(...permissions: SystemPermission[]) {
  return (handler: (request: NextRequest, context?: any) => Promise<NextResponse>) => {
    return withPermission(handler, {
      permissions,
      requireAll: false,
    });
  };
}

/**
 * Create permission guard for all of multiple permissions
 */
export function requireAllPermissions(...permissions: SystemPermission[]) {
  return (handler: (request: NextRequest, context?: any) => Promise<NextResponse>) => {
    return withPermission(handler, {
      permissions,
      requireAll: true,
    });
  };
}
