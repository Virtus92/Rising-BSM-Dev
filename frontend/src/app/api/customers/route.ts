/**
 * Customers API-Route
 * 
 * Handles customer management requests
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { CreateCustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { getLogger } from '@/infrastructure/common/logging';
import { apiPermissions } from '@/app/api/helpers/apiPermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * GET /api/customers
 * 
 * Retrieves a list of customers, optionally filtered and paginated
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using the same pattern as appointment routes
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.CUSTOMERS_VIEW
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.CUSTOMERS_VIEW}`);
      return formatResponse.error(
        `You don't have permission to view customers`, 
        403
      );
    }
    
    // Extract filter parameters from query
    const { searchParams } = new URL(req.url);
    const filters: CustomerFilterParamsDto = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || undefined,
      type: searchParams.get('type') as any || undefined,
      city: searchParams.get('city') || undefined,
      postalCode: searchParams.get('postalCode') || undefined,
      newsletter: searchParams.has('newsletter') 
        ? searchParams.get('newsletter') === 'true'
        : undefined,
      page: searchParams.has('page') 
        ? parseInt(searchParams.get('page') as string)
        : 1,
      limit: searchParams.has('limit') 
        ? parseInt(searchParams.get('limit') as string)
        : 10,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc'
    };

    // Get the customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Context for service calls
    const context = { userId: req.auth?.userId };
    
    // Log detailed debugging information about the request
    logger.debug('Fetching customers with filters:', { 
      filters, 
      userId: req.auth?.userId,
      url: req.url
    });
    
    // Use the service for getting data
    const result = await customerService.getAll({
      context,
      page: filters.page,
      limit: filters.limit,
      filters: {
        status: filters.status,
        type: filters.type,
        city: filters.city,
        postalCode: filters.postalCode,
        newsletter: filters.newsletter,
        search: filters.search
      },
      sort: {
        field: filters.sortBy || 'createdAt',
        direction: (filters.sortDirection || 'desc') as 'asc' | 'desc'
      }
    });

    // Log successful retrieval
    logger.debug('Successfully retrieved customers', { 
      count: result.data?.length || 0,
      total: result.pagination?.total || 0
    });

    // Success response
    return formatResponse.success(
      result,
      'Customers retrieved successfully'
    );
    
  } catch (error) {
    logger.error('Error fetching customers:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.auth?.userId
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Error retrieving customers',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});

/**
 * POST /api/customers
 * 
 * Creates a new customer
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using the same pattern as appointment routes
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.CUSTOMERS_CREATE
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.CUSTOMERS_CREATE}`);
      return formatResponse.error(
        `You don't have permission to create customers`, 
        403
      );
    }
    
    // Parse the request body
    const data = await req.json() as CreateCustomerDto;
    
    // Get the customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Context for service calls
    const context = { 
      userId: req.auth?.userId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown' 
    };
    
    // Create the customer
    const result = await customerService.create(data, { context });
    
    // Success response
    return formatResponse.success(result, 'Customer created successfully', 201);
  } catch (error) {
    logger.error('Error creating customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.auth?.userId
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatResponse.validationError(
        (error as any).validationErrors
      );
    }
    
    // Special case for duplicate email
    if (error instanceof Error && error.message.includes('email already exists')) {
      return formatResponse.error('A customer with this email already exists', 400);
    }
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Error creating customer',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
