/**
 * Get Customers API Route Handler
 * 
 * Handles fetching multiple customers with filtering and pagination
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { CommonStatus } from '@/domain/enums/CommonEnums';

/**
 * Gets a list of customers with filtering and pagination
 * 
 * @param request - HTTP request
 * @returns HTTP response
 */
export async function getCustomersHandler(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Customers list fetch attempted without authentication');
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }
    
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.CUSTOMERS_VIEW
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.CUSTOMERS_VIEW}`);
      return NextResponse.json(
        formatResponse.error(
          `You don't have permission to view customers`, 
          403
        ),
        { status: 403 }
      );
    }
    
    // Extract filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as CommonStatus | undefined,
      type: searchParams.get('type') as any || undefined,
      city: searchParams.get('city') || undefined,
      country: searchParams.get('country') || undefined,
      postalCode: searchParams.get('postalCode') || undefined,
      newsletter: searchParams.has('newsletter') ? searchParams.get('newsletter') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc'
    };
    
    // Validate pagination parameters
    if (isNaN(filters.page) || filters.page < 1) {
      filters.page = 1;
    }
    
    if (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 100) {
      filters.limit = 10;
    }
    
    // Get customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Fetch customers with filtering
    const customersResult = await customerService.findCustomers(filters);
    
    // Return the customers with pagination metadata
    return NextResponse.json(
      formatResponse.success(customersResult, 'Customers retrieved'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching customers:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to fetch customers',
        500
      ),
      { status: 500 }
    );
  }
}
