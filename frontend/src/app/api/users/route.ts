/**
 * API route for users
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { UserFilterParamsDto } from '@/domain/dtos/UserDtos';

/**
 * GET /api/users
 * Get users with optional filtering
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const filterParams: UserFilterParamsDto = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      status: searchParams.get('status') || undefined,
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined
    };

    try {
      // Get user service
      const userService = serviceFactory.createUserService();
      
      // Build criteria for repository
      const criteria: Record<string, any> = {};
      
      // Add status filter if provided
      if (filterParams.status) {
        criteria.status = filterParams.status;
      }
      
      // Add role filter if provided
      if (filterParams.role) {
        criteria.role = filterParams.role;
      }
      
      // Get repository directly
      const repository = userService.getRepository();
      
      // Get total count for pagination
      const total = await repository.count(criteria);
      
      // Prepare pagination options
      const page = filterParams.page || 1;
      const limit = filterParams.limit || 10;
      
      // Find users
      const users = await repository.findByCriteria(criteria, {
        page,
        limit,
        sort: {
          field: filterParams.sortBy || 'createdAt',
          direction: (filterParams.sortOrder?.toLowerCase() || 'desc') as 'asc' | 'desc'
        }
      });
      
      // Map to DTOs
      const userDtos = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
      }));
      
      // Return paginated result
      return formatSuccess({
        data: userDtos,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }, 'Users retrieved successfully');
    } catch (error) {
      logger.error('Error fetching users:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return formatError(
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
  
  // Check if user has admin role
  if (req.auth?.role !== 'ADMIN') {
    return formatError('Unauthorized - Admin access required', 403);
  }

    try {
      // Parse request body
      const data = await req.json();
      
      // Get user service
      const userService = serviceFactory.createUserService();
      
      // Check if email already exists
      const existingUser = await userService.findByEmail(data.email);
      
      if (existingUser) {
        return formatError('Email already in use', 400);
      }
      
      // Create context with user ID for audit
      const context = { userId: req.auth?.userId };
      
      // Ensure password is hashed - normally would be done in service layer
      // Create the user
      const newUser = await userService.create(data, { context });
      
      return formatSuccess(newUser, 'User created successfully', 201);
    } catch (error) {
      logger.error('Error creating user:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return formatError(
        error instanceof Error ? error.message : 'Failed to create user',
        500
      );
    }
}, {
  // Secure this endpoint
  requiresAuth: true,
  requiresRole: ['ADMIN']
});
