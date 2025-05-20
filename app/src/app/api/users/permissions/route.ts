/**
 * API route for managing user permissions
 * Uses strict validation and consistent error handling with proper typing
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler.server';

import { UserRole } from '@/domain/enums/UserEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserPermissionsResponseDto } from '@/domain/dtos/PermissionDtos';
import permissionCache from '@/features/permissions/lib/utils/PermissionCache';

const logger = getLogger();

/**
 * GET /api/users/permissions?userId=123
 * Get permissions for a specific user
 */
export async function GET(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest, user: any) => {
    // Start performance measurement
    const startTime = performance.now();
    
    // Strict input validation
    const searchParams = req.nextUrl.searchParams;
    const userIdParam = searchParams.get('userId');
    
    if (!userIdParam) {
      throw authErrorHandler.createError(
        'Missing userId parameter',
        AuthErrorType.INVALID_REQUEST,
        { searchParams: Object.fromEntries(searchParams.entries()) },
        400
      );
    }
    
    const userId = Number(userIdParam);
    if (isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
      throw authErrorHandler.createError(
        'Invalid userId: must be a positive integer',
        AuthErrorType.INVALID_REQUEST,
        { userId: userIdParam },
        400
      );
    }

    // Ensure authenticated user exists
    const currentUserId = user?.id;
    if (!currentUserId) {
      logger.error('Authentication failed: No user ID in authenticated request', {
        auth: JSON.stringify(user),
        headers: Object.fromEntries(req.headers)
      });
      
      throw authErrorHandler.createError(
        'Authentication required',
        AuthErrorType.AUTH_REQUIRED,
        { endpoint: '/api/users/permissions' },
        401
      );
    }

    // Try to get permissions from cache first
    const cachedPermissions = permissionCache.getPermissions(userId);
    
    if (cachedPermissions) {
      // Calculate performance metrics
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      logger.info(`Retrieved ${cachedPermissions.length} permissions for user ${userId} from cache`, {
        userId,
        permissionCount: cachedPermissions.length,
        permissions: cachedPermissions.length <= 10 
          ? cachedPermissions.join(', ')
          : cachedPermissions.slice(0, 10).join(', ') + '...',
        userPermissionsCount: 0,
        duration,
        source: 'cache'
      });

      // Return cached permissions
      return NextResponse.json({
        success: true,
        data: cachedPermissions,
        message: 'Permissions retrieved successfully'
      }, { status: 200 });
    }

    // Cache miss - get permissions from service
    // Initialize services
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    const permissionService = serviceFactory.createPermissionService();
    
    // Get both users in parallel with proper error handling
    const [targetUser, currentUser] = await Promise.all([
      userService.getById(userId).catch(error => {
        logger.error('Error fetching target user:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId
        });
        throw authErrorHandler.createError(
          'Failed to fetch target user',
          AuthErrorType.DATABASE_ERROR,
          { userId },
          500
        );
      }),
      userService.getById(currentUserId).catch(error => {
        logger.error('Error fetching current user:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: currentUserId
        });
        throw authErrorHandler.createError(
          'Failed to fetch current user',
          AuthErrorType.DATABASE_ERROR,
          { userId: currentUserId },
          500
        );
      })
    ]);
    
    // Verify target user exists
    if (!targetUser) {
      throw authErrorHandler.createError(
        'User not found',
        AuthErrorType.RESOURCE_NOT_FOUND,
        { userId },
        404
      );
    }
    
    // Access control check using strict permissions
    const isSelfAccess = userId === currentUserId;
    
    // Ensure currentUser exists before accessing its properties
    if (!currentUser) {
      throw authErrorHandler.createError(
        'Current user data not found',
        AuthErrorType.INTERNAL_ERROR,
        { currentUserId },
        500
      );
    }
    
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isManager = currentUser.role === UserRole.MANAGER;
    
    if (!isSelfAccess && !isAdmin && !isManager) {
      // Specific permission check for non-admin/manager users
      const hasViewPermission = await permissionMiddleware.hasPermission(
        currentUserId,
        SystemPermission.USERS_VIEW
      );
      
      if (!hasViewPermission) {
        throw authErrorHandler.createPermissionError(
          'Insufficient permissions to view other user permissions',
          { 
            currentUserId,
            targetUserId: userId,
            requiredPermission: SystemPermission.USERS_VIEW
          }
        );
      }
    }
    
    // Get user permissions with strict type checking
    let userPermissions: UserPermissionsResponseDto;
    try {
      userPermissions = await permissionService.getUserPermissions(userId, {
        context: { userId: currentUserId }
      });
      
      // Validate the structure immediately to fail fast if data is invalid
      if (!userPermissions || typeof userPermissions !== 'object') {
        throw new Error(`Invalid permissions response: ${JSON.stringify(userPermissions)}`);
      }
      
      if (!Array.isArray(userPermissions.permissions)) {
        throw new Error(`permissions is not an array: ${JSON.stringify(userPermissions)}`);
      }
      
    } catch (error) {
      logger.error('Error retrieving user permissions:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        currentUserId
      });
      throw authErrorHandler.createError(
        'Failed to retrieve user permissions',
        AuthErrorType.PERMISSION_CHECK_FAILED,
        { userId, error: error instanceof Error ? error.message : String(error) },
        500
      );
    }
    
    // Ensure we have a valid permissions array - strictly enforce the contract
    if (!Array.isArray(userPermissions.permissions)) {
      logger.error('Invalid permissions data format', {
        userId,
        receivedType: typeof userPermissions.permissions,
        receivedValue: JSON.stringify(userPermissions.permissions)
      });
      
      throw authErrorHandler.createError(
        'Invalid permissions data format from service',
        AuthErrorType.INTERNAL_ERROR,
        { 
          userId,
          receivedType: typeof userPermissions.permissions,
          receivedValue: JSON.stringify(userPermissions)
        },
        500
      );
    }
    
    // CRITICAL FIX: Return permissions in a consistent format
    // We need to return both the permissions array AND the role for proper processing
    
    // Ensure we have the right data format
    const formattedPermissions = {
      permissions: Array.isArray(userPermissions.permissions) ? userPermissions.permissions : [],
      userId: userId,
      role: userPermissions.role || targetUser.role || 'user' // Fallback to user's role if not in permissions
    };
    
    // Store in cache for future requests
    permissionCache.cachePermissions(userId, formattedPermissions.permissions);
    
    // Calculate performance metrics
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    // Log comprehensive data for debugging 
    logger.info(`Retrieved ${formattedPermissions.permissions.length} permissions for user ${userId} from database`, {
      userId,
      role: formattedPermissions.role,
      permissionCount: formattedPermissions.permissions.length,
      permissions: formattedPermissions.permissions.length <= 10 
        ? formattedPermissions.permissions.join(', ')
        : formattedPermissions.permissions.slice(0, 10).join(', ') + '...',
      duration,
      source: 'database'
    });

    // Return consistent format with all required fields
    return NextResponse.json({
      success: true,
      data: formattedPermissions,
      message: 'Permissions retrieved successfully'
    }, { status: 200 });
  });
  
  return authHandler(request);
}

/**
 * POST /api/users/permissions
 * Update permissions for a user
 */
export async function POST(request: NextRequest) {
  const authHandler = await withAuth(async (req: NextRequest, user: any) => {
    const logger = getLogger();
    const serviceFactory = getServiceFactory();

    // Parse request body with better error handling
    let data;
    try {
      data = await req.json();
    } catch (parseError) {
      logger.error('Failed to parse request body', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        stack: parseError instanceof Error ? parseError.stack : undefined
      });
      
      throw authErrorHandler.createError(
        'Invalid JSON in request body',
        AuthErrorType.INVALID_REQUEST,
        { error: parseError instanceof Error ? parseError.message : String(parseError) },
        400
      );
    }
    
    const { userId, permissions } = data;
    
    if (!userId || !permissions || !Array.isArray(permissions)) {
      logger.error('Invalid request data', {
        hasUserId: !!userId,
        hasPermissions: !!permissions,
        permissionsIsArray: Array.isArray(permissions),
        receivedData: JSON.stringify(data)
      });
      
      throw authErrorHandler.createError(
        'Invalid request data: userId and permissions array are required',
        AuthErrorType.INVALID_REQUEST,
        { 
          receivedData: JSON.stringify(data),
          validationErrors: {
            userId: !userId ? 'Missing userId' : undefined,
            permissions: !permissions ? 'Missing permissions' : (!Array.isArray(permissions) ? 'permissions must be an array' : undefined)
          }
        },
        400
      );
    }

    // Get the current authenticated user
    const currentUserId = user?.id;
    if (!currentUserId) {
      logger.error('Authentication failed: No user ID in authenticated request', {
        auth: JSON.stringify(user),
        headers: Object.fromEntries(req.headers)
      });
      
      throw authErrorHandler.createError(
        'Authentication required',
        AuthErrorType.AUTH_REQUIRED,
        { endpoint: '/api/users/permissions', method: 'POST' },
        401
      );
    }

    // Check if the users exist
    const userService = serviceFactory.createUserService();
    
    // Find both users with proper error handling
    let targetUser;
    let currentUser;
    
    try {
      [targetUser, currentUser] = await Promise.all([
        userService.getById(Number(userId)),
        userService.getById(Number(currentUserId))
      ]);
    } catch (error) {
      logger.error('Error fetching user data:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        targetUserId: Number(userId), 
        currentUserId
      });
      
      throw authErrorHandler.createError(
        'Failed to fetch user data',
        AuthErrorType.DATABASE_ERROR,
        { userId: Number(userId), currentUserId },
        500
      );
    }
    
    if (!targetUser) {
      throw authErrorHandler.createError(
        'User not found',
        AuthErrorType.RESOURCE_NOT_FOUND,
        { userId: Number(userId) },
        404
      );
    }
    
    // Ensure currentUser exists
    if (!currentUser) {
      throw authErrorHandler.createError(
        'Current user data not found',
        AuthErrorType.INTERNAL_ERROR,
        { currentUserId },
        500
      );
    }
    
    // Security checks
    if (currentUser.role !== UserRole.ADMIN) {
      // Managers can only edit non-admin users
      if (currentUser.role === UserRole.MANAGER && targetUser.role === UserRole.ADMIN) {
        throw authErrorHandler.createPermissionError(
          'Managers cannot modify admin permissions',
          { 
            currentUserRole: currentUser.role,
            targetUserRole: targetUser.role 
          }
        );
      }
      
      // Non-admin/manager users cannot modify permissions at all
      if (currentUser.role !== UserRole.MANAGER) {
        throw authErrorHandler.createPermissionError(
          'You do not have permission to update user permissions',
          { 
            currentUserRole: currentUser.role,
            requiredRole: 'ADMIN or MANAGER'
          }
        );
      }
    }
    
    // Validate permissions array for security
    // This prevents someone from adding permissions they shouldn't have
    const validSystemPermissions = Object.values(SystemPermission);
    
    // Filter out any invalid permission codes
    const validatedPermissions = permissions.filter(permission => {
      // Check if it's a valid system permission
      return validSystemPermissions.includes(permission as SystemPermission);
    });
    
    // If there are any invalid permissions, log a warning
    if (validatedPermissions.length !== permissions.length) {
      const invalidPermissions = permissions.filter(p => !validSystemPermissions.includes(p as SystemPermission));
      logger.warn('Invalid permissions in update request:', {
        invalidPermissions,
        userId: Number(userId),
        requestedBy: currentUserId
      });
    }
    
    // Create permission service
    const permissionService = serviceFactory.createPermissionService();
    
    // Update permissions
    let success;
    try {
      success = await permissionService.updateUserPermissions(
        {
          userId: Number(userId),
          permissions: validatedPermissions
        },
        {
          context: {
            userId: user?.id,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
          }
        }
      );
    } catch (updateError) {
      logger.error('Failed to update user permissions', {
        error: updateError instanceof Error ? updateError.message : String(updateError),
        stack: updateError instanceof Error ? updateError.stack : undefined,
        userId: Number(userId),
        permissions: validatedPermissions
      });
      
      throw authErrorHandler.createError(
        'Failed to update user permissions',
        AuthErrorType.DATABASE_ERROR,
        { 
          userId: Number(userId),
          error: updateError instanceof Error ? updateError.message : String(updateError)
        },
        500
      );
    }
    
    // Invalidate the permissions cache for this user
    permissionCache.invalidateCache(Number(userId));
    
    // Log the permission update for audit purposes
    logger.info(`User permissions updated for user ${userId} by ${user?.id}`, {
      userId: Number(userId),
      updatedBy: user?.id,
      permissionCount: validatedPermissions.length,
      allPermissions: validatedPermissions, // Log all permissions for debugging
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return NextResponse.json(
      formatResponse.success({
        userId: Number(userId),
        success,
        permissions: validatedPermissions
      }, 'User permissions updated successfully')
    );
  });
  
  return authHandler(request);
}
