/**
 * API route for requests
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/requests
 * Get requests with optional filtering
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Get repository
    const repository = requestService.getRepository();
    
    // Build criteria
    const criteria: Record<string, any> = {};
    
    if (status) {
      criteria.status = status;
    }
    
    // Get total count
    const total = await repository.count(criteria);
    
    // Get requests with pagination
    const requests = await repository.findByCriteria(criteria, {
      page,
      limit,
      sort: {
        field: sortBy,
        direction: sortOrder.toLowerCase() as 'asc' | 'desc'
      }
    });
    
    // Map to DTOs
    const requestDtos = requests.map(request => ({
      id: request.id,
      name: request.name,
      email: request.email,
      phone: request.phone,
      service: request.service,
      message: request.message,
      status: request.status,
      processorId: request.processorId,
      customerId: request.customerId,
      appointmentId: request.appointmentId,
      createdAt: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
      updatedAt: request.updatedAt instanceof Date ? request.updatedAt.toISOString() : request.updatedAt
    }));
    
    // Return paginated results
    return formatSuccess({
      data: requestDtos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Requests retrieved successfully');
    
  } catch (error) {
    logger.error('Error fetching requests:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to fetch requests',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});

/**
 * POST /api/requests
 * Create a new request
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Parse request body
    const data = await req.json();
    
    // Create context info
    const context = {
      userId: req.auth?.userId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Create the request with proper validation
    const newRequest = await requestService.create(data, { context });
    
    return formatSuccess(newRequest, 'Request created successfully', 201);
    
  } catch (error) {
    logger.error('Error creating request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
        'Request validation failed'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to create request',
      500
    );
  }
}, {
  // This endpoint is public for contact form submissions
  requiresAuth: false
});
