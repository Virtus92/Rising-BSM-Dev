/**
 * API route for users
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { UserFilterParamsDto } from '@/domain/dtos/UserDtos';
import { UserStatus, UserRole } from '@/domain/enums/UserEnums';
import { apiPermissions } from '@/app/api/helpers/apiPermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * GET /api/users
 * Get users with optional filtering
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Validate authentication
    if (!req.auth?.userId) {
      logger.warn('User list access attempted without authentication');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Check permission using the same pattern as appointment routes
    if (!await apiPermissions.hasPermission(
      req.auth.userId, 
      SystemPermission.USERS_VIEW
    )) {
      logger.warn(`Permission denied: User ${req.auth.userId} does not have permission ${SystemPermission.USERS_VIEW}`);
      return formatResponse.error(
        `You don't have permission to view users`, 
        403
      );
    }
    
    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const sortDirectionParam = searchParams.get('sortDirection');
    
    const filterParams: UserFilterParamsDto = {
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: (sortDirectionParam === 'asc' || sortDirectionParam === 'desc') 
        ? sortDirectionParam 
        : 'desc',
      status: searchParams.get('status') ? (searchParams.get('status') as UserStatus) : undefined,
      role: searchParams.get('role') ? (searchParams.get('role') as UserRole) : undefined,
      search: searchParams.get('search') || undefined
    };

    // Debug log the filter parameters
    logger.debug('Filter parameters for user list:', filterParams);

    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Get users through the service
    const result = await userService.getAll({
      context: { userId: req.auth?.userId },
      page: filterParams.page,
      limit: filterParams.limit,
      filters: {
        status: filterParams.status,
        role: filterParams.role,
        search: filterParams.search
      },
      sort: {
        field: filterParams.sortBy || 'createdAt',
        direction: (filterParams.sortDirection?.toLowerCase() || 'desc') as 'asc' | 'desc' // FIXED: Use sortDirection consistently
      }
    });
    
    return formatResponse.success(result, 'Users retrieved successfully');
  } catch (error) {
    logger.error('Error fetching users:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch users',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});

/**
 * POST /api/users
 * Create a new user
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Check permission using the same pattern as appointment routes
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.USERS_CREATE
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_CREATE}`);
      return formatResponse.error(
        `You don't have permission to create users`, 
        403
      );
    }

    // Parse request body
    const data = await req.json();
    
    // Validate input data
    const { validateUserCreation } = await import('@/infrastructure/common/validation/userValidation');
    const validationResult = validateUserCreation(data);
    
    if (!validationResult.isValid) {
      return formatResponse.error(
        `Validation failed: ${validationResult.errors.join(', ')}`,
        400
      );
    }
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Check if email already exists
    const existingUser = await userService.findByEmail(data.email);
    
    if (existingUser) {
      return formatResponse.error('Email already in use', 400);
    }
    
    // Create context with user ID for audit
    const context = { 
      userId: req.auth?.userId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Create the user - ensure status is set appropriately by the service
    const newUser = await userService.create({
      ...data,
      // Omit status property if sent from client, as it's controlled by the service
    }, { context });
    
    return formatResponse.success(newUser, 'User created successfully', 201);
  } catch (error) {
    logger.error('Error creating user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to create user',
      500
    );
  }
}, {
  // Use consistent requiresAuth approach and handle permissions inside the handler
  requiresAuth: true
});
