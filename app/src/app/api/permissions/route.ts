/**
 * API route for managing permissions
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { PermissionFilterParamsDto, CreatePermissionDto } from '@/domain/dtos/PermissionDtos';

/**
 * GET /api/permissions
 * Get permissions with optional filtering
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
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
    
    // Get permissions through the service
    const result = await permissionService.findPermissions(filterParams, {
      context: { userId: req.auth?.userId }
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
}, {
  // Secure this endpoint
  requiresAuth: true
});

/**
 * POST /api/permissions
 * Create a new permission
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
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
}, {
  // In production, only admins would have this permission
  requiresAuth: true,
  requiresRole: process.env.NODE_ENV === 'production' ? ['ADMIN'] : undefined
});
