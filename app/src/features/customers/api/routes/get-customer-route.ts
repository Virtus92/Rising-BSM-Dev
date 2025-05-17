/**
 * Get Customer API Route Handler
 * 
 * Handles fetching a single customer by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * Gets a customer by ID
 * 
 * @param request - HTTP request
 * @param params - URL parameters including customer ID
 * @returns HTTP response
 */
export async function getCustomerHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Customer fetch attempted without authentication');
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }
    
    // Validate ID
    const customerId = parseInt(params.id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json(
        formatResponse.error('Invalid customer ID', 400),
        { status: 400 }
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
    
    // Get customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Check if customer exists and fetch details
    const customer = await customerService.getById(customerId);
    
    if (!customer) {
      return NextResponse.json(
        formatResponse.error('Customer not found', 404),
        { status: 404 }
      );
    }
    
    // Optionally get additional details if requested
    const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
    
    if (detailed) {
      const detailedCustomer = await customerService.getCustomerDetails(customerId);
      return NextResponse.json(
        formatResponse.success(detailedCustomer, 'Customer details retrieved'),
        { status: 200 }
      );
    }
    
    // Return the customer data
    return NextResponse.json(
      formatResponse.success(customer, 'Customer retrieved'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId: params.id
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to fetch customer',
        500
      ),
      { status: 500 }
    );
  }
}
