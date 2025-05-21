/**
 * API route for retrieving role-based permissions
 * Provides default permissions for each role in the system
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler.server';
import { UserRole } from '@/domain/enums/UserEnums';
import permissionCache from '@/features/permissions/lib/utils/PermissionCache';

// NOTE: Runtime config is now in runtime.ts file
const logger = getLogger();

/**
 * Explicit TypeScript types for Route Parameters
 */
type RouteParams = { params: { role: string } };

// Initialize the GET handler by awaiting the withAuth middleware
const initGETHandler = async () => {
  return await withAuth(async (request: NextRequest, user: any) => {
    // Extract params from URL directly
    const role = request.nextUrl.pathname.split('/').pop() || '';
    
    // Start performance measurement
    const startTime = performance.now();
    
    // Validate role parameter
    if (!role) {
      throw authErrorHandler.createError(
        'Missing role parameter',
        AuthErrorType.INVALID_REQUEST,
        { path: request.nextUrl.pathname },
        400
      );
    }
    
    // Normalize role
    const normalizedRole = role.toLowerCase();
    
    // Check if role is valid
    const validRoles = Object.values(UserRole).map(r => String(r).toLowerCase());
    if (!validRoles.includes(normalizedRole)) {
      throw authErrorHandler.createError(
        `Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(', ')}`,
        AuthErrorType.INVALID_REQUEST,
        { role, validRoles },
        400
      );
    }
    
    // Try to get permissions from cache first
    const cachedPermissions = permissionCache.getRolePermissions(normalizedRole);
    
    if (cachedPermissions) {
      // Calculate performance metrics
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      logger.info(`Retrieved ${cachedPermissions.length} permissions for role ${normalizedRole} from cache`, {
        role: normalizedRole,
        permissionCount: cachedPermissions.length,
        permissions: cachedPermissions.length <= 10 
          ? cachedPermissions.join(', ')
          : cachedPermissions.slice(0, 10).join(', ') + '...',
        duration,
        source: 'cache'
      });
      
      return NextResponse.json({
        success: true,
        data: cachedPermissions,
        message: 'Role permissions retrieved successfully'
      }, { status: 200 });
    }
    
    // Cache miss - get permissions from service
    const serviceFactory = getServiceFactory();
    const permissionService = serviceFactory.createPermissionService();
    
    try {
      // Get role permissions
      const permissions = await permissionService.getDefaultPermissionsForRole(normalizedRole);
      
      // Cache the permissions
      permissionCache.cacheRolePermissions(normalizedRole, permissions);
      
      // Calculate performance metrics
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      logger.info(`Retrieved ${permissions.length} permissions for role ${normalizedRole} from database`, {
        role: normalizedRole,
        permissionCount: permissions.length,
        permissions: permissions.length <= 10 
          ? permissions.join(', ')
          : permissions.slice(0, 10).join(', ') + '...',
        duration,
        source: 'database'
      });
      
      return NextResponse.json({
        success: true,
        data: permissions,
        message: 'Role permissions retrieved successfully'
      }, { status: 200 });
    } catch (error) {
      logger.error(`Error retrieving permissions for role ${normalizedRole}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        role: normalizedRole
      });
      
      throw authErrorHandler.createError(
        `Failed to retrieve permissions for role ${normalizedRole}`,
        AuthErrorType.DATABASE_ERROR,
        { role: normalizedRole, error: error instanceof Error ? error.message : String(error) },
        500
      );
    }
  });
};

// Initialize the POST handler by awaiting the withAuth middleware
const initPOSTHandler = async () => {
  return await withAuth(async (request: NextRequest, user: any) => {
    // Extract params from URL directly
    const role = request.nextUrl.pathname.split('/').pop() || '';
    
    // Start performance measurement
    const startTime = performance.now();
    
    // Validate role parameter
    if (!role) {
      throw authErrorHandler.createError(
        'Missing role parameter',
        AuthErrorType.INVALID_REQUEST,
        { path: request.nextUrl.pathname },
        400
      );
    }
    
    // Only admins can update role permissions
    if (user.role !== UserRole.ADMIN) {
      throw authErrorHandler.createPermissionError(
        'Only administrators can set default role permissions',
        { userRole: user.role, requiredRole: UserRole.ADMIN }
      );
    }
    
    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      throw authErrorHandler.createError(
        'Invalid JSON in request body',
        AuthErrorType.INVALID_REQUEST,
        { error: parseError instanceof Error ? parseError.message : String(parseError) },
        400
      );
    }
    
    // Validate permissions array
    const { permissions } = data;
    if (!permissions || !Array.isArray(permissions)) {
      throw authErrorHandler.createError(
        'Invalid request data: permissions array is required',
        AuthErrorType.INVALID_REQUEST,
        { 
          receivedData: JSON.stringify(data),
          validationErrors: {
            permissions: !permissions ? 'Missing permissions' : (!Array.isArray(permissions) ? 'permissions must be an array' : undefined)
          }
        },
        400
      );
    }
    
    // Normalize role
    const normalizedRole = role.toLowerCase();
    
    // Check if role is valid
    const validRoles = Object.values(UserRole).map(r => String(r).toLowerCase());
    if (!validRoles.includes(normalizedRole)) {
      throw authErrorHandler.createError(
        `Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(', ')}`,
        AuthErrorType.INVALID_REQUEST,
        { role, validRoles },
        400
      );
    }
    
    // Get permission service
    const serviceFactory = getServiceFactory();
    const permissionService = serviceFactory.createPermissionService();
    
    try {
      // Update role permissions
      const updatedPermissions = await permissionService.setDefaultPermissionsForRole(
        normalizedRole,
        permissions,
        { userId: user.id }
      );
      
      // Invalidate cache for this role
      permissionCache.invalidateRoleCache(normalizedRole);
      
      // Calculate performance metrics
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      logger.info(`Updated ${updatedPermissions.length} permissions for role ${normalizedRole}`, {
        role: normalizedRole,
        permissionCount: updatedPermissions.length,
        permissions: updatedPermissions.length <= 10 
          ? updatedPermissions.join(', ')
          : updatedPermissions.slice(0, 10).join(', ') + '...',
        duration,
        updatedBy: user.id
      });
      
      return NextResponse.json(
        formatResponse.success({
          role: normalizedRole,
          permissions: updatedPermissions,
          count: updatedPermissions.length
        }, 'Role permissions updated successfully')
      );
    } catch (error) {
      logger.error(`Error updating permissions for role ${normalizedRole}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        role: normalizedRole
      });
      
      throw authErrorHandler.createError(
        `Failed to update permissions for role ${normalizedRole}`,
        AuthErrorType.DATABASE_ERROR,
        { role: normalizedRole, error: error instanceof Error ? error.message : String(error) },
        500
      );
    }
  });
};

// Export the handlers after awaiting middleware initialization
export const GET = await initGETHandler();
export const POST = await initPOSTHandler();
