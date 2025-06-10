/**
 * API route for requests
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
// Use server-side service factory for direct database access
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { RequestFilterParamsDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/requests
 * Get requests with optional filtering
 */
export const GET = routeHandler(
  async (req: NextRequest) => {
    const logger = getLogger();
    
    // Enhanced authentication validation: check both auth object and custom header
    const authUserId = req.auth?.userId || null;
    const headerUserId = req.headers.get('X-Auth-User-ID');
    
    // Log authentication details for debugging
    logger.debug('Authentication check details - requests', {
      hasAuthProperty: !!req.auth,
      authUserId: authUserId,
      headerUserId: headerUserId,
      allHeaders: Object.fromEntries([...req.headers.entries()])
    });
    
    // Use either source of authentication
    const userId = authUserId || (headerUserId ? parseInt(headerUserId, 10) : null);
    
    if (!userId) {
      logger.warn('Requests access attempted without authentication');
      return formatResponse.unauthorized('Authentication required');
    }
    
    // Ensure the request auth object is available for the rest of the function
    if (!req.auth && userId) {
      // If only the header is available, create the auth object
      Object.defineProperty(req, 'auth', {
        value: { userId },
        writable: false,
        enumerable: true,
        configurable: false
      });
    }
      
    // Then manually check for permission - avoiding the middleware to prevent circular issues
    try {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      // Get query parameters for filtering
      const { searchParams } = new URL(req.url);
      
      // Check for permitted sort fields to prevent errors
      const requestedSortBy = searchParams.get('sortBy') || 'createdAt';
      const permittedSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'status', 'service', 'processorId', 'customerId'];
      const sortBy = permittedSortFields.includes(requestedSortBy) ? requestedSortBy : 'createdAt';
      
      // Ensure sort direction is valid
      const requestedSortDirection = searchParams.get('sortDirection') || 'desc';
      const sortDirection = ['asc', 'desc'].includes(requestedSortDirection) ? requestedSortDirection as 'asc' | 'desc' : 'desc';
      
      const filters: RequestFilterParamsDto = {
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
        status: searchParams.get('status') as RequestStatus | undefined,
        service: searchParams.get('service') || undefined,
        search: searchParams.get('search') || undefined,
        sortBy: sortBy,
        sortDirection: sortDirection,
        processorId: searchParams.get('processorId') ? parseInt(searchParams.get('processorId')!) : undefined,
        unassigned: searchParams.get('unassigned') === 'true',
        notConverted: searchParams.get('notConverted') === 'true',
        // Add customerId filter parameter
        customerId: searchParams.get('customerId') ? parseInt(searchParams.get('customerId')!) : undefined
      };
      
      // Log the customerId for debugging
      if (searchParams.get('customerId')) {
        logger.info(`Filtering requests by customer ID: ${searchParams.get('customerId')}`);
      }
      
      logger.debug('Request filters:', filters);
      
      // Parse date parameters if present
      if (searchParams.get('startDate')) {
        filters.startDate = new Date(searchParams.get('startDate')!);
      }
      
      if (searchParams.get('endDate')) {
        filters.endDate = new Date(searchParams.get('endDate')!);
      }
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Get requests with filtering
      const result = await requestService.findRequests(filters, { context });
      
      // Return paginated results
      return formatResponse.success(
        result,
        'Requests retrieved successfully'
      );
    } catch (error) {
      logger.error('Error in GET /api/requests:', error as Error);
      
      if (error instanceof Error && error.message.includes('permission')) {
        return formatResponse.forbidden('You do not have permission to view requests');
      }
      
      return formatResponse.error(
        error instanceof Error ? error.message : 'An error occurred while retrieving requests',
        500
      );
    }
  },
  { requiresAuth: true }
);

/**
 * POST /api/requests
 * Create a new request
 */
// Create a handler function that matches the expected signature
const createRequestHandler = async (req: NextRequest) => {
  // Handler implementation

  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  // Parse request body
  const data = await req.json();
  
  // Create context info with properly typed customerId
  interface RequestContext {
    userId?: number;
    userRole?: string;
    ipAddress: string;
    customerId?: number;
  }
  
  const context: RequestContext = {
    userId: req.auth?.userId,
    userRole: req.auth?.role,
    ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    customerId: undefined
  };
  
  // If this is an authenticated user with role 'user', they are likely a customer
  // Try to find their associated customerId
  if (req.auth?.userId && req.auth?.role === 'user') {
    try {
      const userService = serviceFactory.createUserService();
      const userDetails = await userService.getById(req.auth.userId);
      
      // Check if this user has an associated customerId that is a number
      if (userDetails && 
        'customerId' in userDetails && 
        typeof userDetails.customerId === 'number') {
        context.customerId = userDetails.customerId;
      logger.info(`Found associated customer ID ${userDetails.customerId} for user ${req.auth.userId}`);
    }
    } catch (error) {
      // Log the error but continue with request creation
      logger.warn(`Failed to find customer ID for user ${req.auth?.userId}`, { error });
    }
  }
  
  // Get request service
  const requestService = serviceFactory.createRequestService();
  
  try {
    // Create the request with proper validation
    const newRequest = await requestService.createRequest(data, { context });
    
    return formatResponse.success(newRequest, 'Request created successfully', 201);
  } catch (error) {
    logger.error('Error creating request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.auth?.userId
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatResponse.validationError(
        (error).validationErrors
      );
    }
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Error creating request',
      500
    );
  }
};

export const POST = routeHandler(createRequestHandler, {
  // This endpoint is public for contact form submissions
  requiresAuth: false
});
