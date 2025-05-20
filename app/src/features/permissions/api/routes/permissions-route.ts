/**
 * Permissions API Route Handlers
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { PermissionFilterParamsDto, CreatePermissionDto } from '@/domain/dtos/PermissionDtos';

/**
 * Get permissions with optional filtering
 */
export async function getPermissionsHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const filterParams: PermissionFilterParamsDto = {
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc',
      category: searchParams.get('category') || undefined,
      code: searchParams.get('code') || undefined,
      search: searchParams.get('search') || undefined
    };

    // Create permission service
    const permissionService = serviceFactory.createPermissionService();
    
    // User ID handling with better error messaging
    const userId = req.auth?.userId;
    if (!userId) {
      logger.warn('No user ID found in auth object for permission request', {
        authObject: req.auth ? 'present' : 'missing',
        headers: Object.fromEntries([...req.headers.entries()].filter(entry => entry[0].startsWith('x-auth')))
      });
      
      throw new Error('Authentication required - User ID not found in request');
    }
    
    // Get permissions through the service
    const result = await permissionService.findPermissions(filterParams, {
      context: { userId }
    });
    
    return formatResponse.success(result, 'Permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permissions:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch permissions',
      500
    );
  }
}

/**
 * Create a new permission
 */
export async function createPermissionHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Parse request body
    const data = await req.json();
    
    // Create permission service
    const permissionService = serviceFactory.createPermissionService();
    
    // Create context with user ID for audit
    const context = { 
      userId: req.auth?.userId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Create the permission
    const newPermission = await permissionService.create(data, { context });
    
    return formatResponse.success(newPermission, 'Permission created successfully', 201);
  } catch (error) {
    logger.error('Error creating permission:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to create permission',
      500
    );
  }
}
