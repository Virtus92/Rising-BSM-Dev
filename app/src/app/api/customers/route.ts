/**
 * Customers API-Route
 * 
 * Handles customer management requests
 */
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { CreateCustomerDto, CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { routeHandler } from '@/core/api/server/route-handler';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';

/**
 * GET /api/customers
 * 
 * Retrieves a list of customers, optionally filtered and paginated
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      try {
        // Extract filter parameters from query
        const { searchParams } = new URL(req.url);
        
        // Check for permitted sort fields to prevent errors
        const requestedSortBy = searchParams.get('sortBy') || 'createdAt';
        const permittedSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'company', 'city', 'type', 'status', 'newsletter', 'postalCode'];
        const sortBy = permittedSortFields.includes(requestedSortBy) ? requestedSortBy : 'createdAt';
        
        // Ensure sort direction is valid
        const requestedSortDirection = searchParams.get('sortDirection') || 'desc';
        const sortDirection = ['asc', 'desc'].includes(requestedSortDirection) ? requestedSortDirection as 'asc' | 'desc' : 'desc';
        
        const filters: CustomerFilterParamsDto = {
          search: searchParams.get('search') || undefined,
          status: searchParams.get('status') as CommonStatus || undefined,
          type: searchParams.get('type') as CustomerType|| undefined,
          city: searchParams.get('city') || undefined,
          country: searchParams.get('country') || undefined, // FIX: Added missing country filter
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
          sortBy: sortBy,
          sortDirection: sortDirection
        };
        
        logger.debug('Customer filters:', filters);

        // Get the customer service
        const customerService = serviceFactory.createCustomerService();
        
        // Get user from headers (set by auth middleware)
        const userId = parseInt(req.headers.get('X-User-Id') || '0');
        const context = { userId };
        
        // Use the service for getting data
        const result = await customerService.getAll({
          context,
          page: filters.page,
          limit: filters.limit,
          filters: {
            status: filters.status,
            type: filters.type,
            city: filters.city,
            country: filters.country, // FIX: Added missing country filter
            postalCode: filters.postalCode,
            newsletter: filters.newsletter,
            search: filters.search
          },
          sort: {
            field: filters.sortBy || 'createdAt',
            direction: (filters.sortDirection || 'desc') as 'asc' | 'desc'
          }
        });

        // Success response
        return formatResponse.success(
          result,
          'Customers retrieved successfully'
        );
        
      } catch (error) {
        logger.error('Error fetching customers:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        return formatResponse.error(
          error instanceof Error ? error.message : 'Error retrieving customers',
          500
        );
      }
    }
    ,
    SystemPermission.CUSTOMERS_VIEW
  ),
  { requiresAuth: true }
);

/**
 * POST /api/customers
 * 
 * Creates a new customer
 */
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      try {
        // Parse the request body
        const data = await req.json() as CreateCustomerDto;
        
        // Get the customer service
        const customerService = serviceFactory.createCustomerService();
        
        // Get user from headers (set by auth middleware)
        const userId = parseInt(req.headers.get('X-User-Id') || '0');
        const context = { 
          userId,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown' 
        };
        
        // Create the customer
        const result = await customerService.create(data, { context });
        
        // Success response
        return formatResponse.success(result, 'Customer created successfully', 201);
      } catch (error) {
        logger.error('Error creating customer:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Handle validation errors
        if (error instanceof Error && 'validationErrors' in error) {
          return formatResponse.validationError(
            (error).validationErrors
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
    }
    ,
    SystemPermission.CUSTOMERS_CREATE
  ),
  { requiresAuth: true }
);
