/**
 * Customers API-Route
 * 
 * Handles customer management requests
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatValidationError } from '@/infrastructure/api/response-formatter';
import { CreateCustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * GET /api/customers
 * 
 * Retrieves a list of customers, optionally filtered and paginated
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
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
      sortBy: searchParams.get('sortBy') || undefined,
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || undefined
    };

    // Get the customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Context for service calls
    const context = { userId: req.auth?.userId };
    
    // Get repository directly for more stable access
    const repository = customerService.getRepository();
    
    // Build criteria
    const criteria: Record<string, any> = {};
    
    if (filters.status) {
      criteria.status = filters.status;
    }
    
    if (filters.type) {
      criteria.type = filters.type;
    }
    
    if (filters.city) {
      criteria.city = filters.city;
    }
    
    if (filters.postalCode) {
      criteria.postalCode = filters.postalCode;
    }
    
    if (filters.newsletter !== undefined) {
      criteria.newsletter = filters.newsletter;
    }
    
    // Get total count
    const total = await repository.count(criteria);
    
    // Get customers with pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    
    // Get data from repository directly
    const customers = await repository.findByCriteria(criteria, {
      page,
      limit,
      sort: {
        field: filters.sortBy || 'createdAt',
        direction: (filters.sortDirection || 'desc') as 'asc' | 'desc'
      }
    });
    
    // Map to DTOs
    const customerDtos = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      type: customer.type,
      status: customer.status,
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode,
      country: customer.country,
      newsletter: customer.newsletter,
      createdAt: customer.createdAt instanceof Date ? customer.createdAt.toISOString() : customer.createdAt,
      updatedAt: customer.updatedAt instanceof Date ? customer.updatedAt.toISOString() : customer.updatedAt
    }));
    
    // Create result with pagination
    const result = {
      data: customerDtos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Success response
    return formatSuccess(
      result,
      'Customers retrieved successfully'
    );
    
  } catch (error) {
    logger.error('Error fetching customers:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
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
    return formatSuccess(result, 'Customer created successfully', 201);
  } catch (error) {
    logger.error('Error creating customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
        'Customer validation failed'
      );
    }
    
    // Special case for duplicate email
    if (error instanceof Error && error.message.includes('email already exists')) {
      return formatError('A customer with this email already exists', 400);
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Error creating customer',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
