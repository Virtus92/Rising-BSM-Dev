/**
 * Update Customer API Route Handler
 * 
 * Handles updating an existing customer
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * Updates a customer by ID
 * 
 * @param request - HTTP request
 * @param params - URL parameters including customer ID
 * @returns HTTP response
 */
export async function updateCustomerHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Customer update attempted without authentication');
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
      SystemPermission.CUSTOMERS_EDIT
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.CUSTOMERS_EDIT}`);
      return NextResponse.json(
        formatResponse.error(
          `You don't have permission to update customers`, 
          403
        ),
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    
    // Basic validation
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return NextResponse.json(
          formatResponse.error(
            'Invalid email format',
            400
          ),
          { status: 400 }
        );
      }
    }
    
    // Get customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Check if customer exists
    const existingCustomer = await customerService.getById(customerId);
    
    if (!existingCustomer) {
      return NextResponse.json(
        formatResponse.error('Customer not found', 404),
        { status: 404 }
      );
    }
    
    // Check for email uniqueness if email is being changed
    if (data.email && data.email !== existingCustomer.email) {
      const customerWithSameEmail = await customerService.findByEmail(data.email);
      
      if (customerWithSameEmail && customerWithSameEmail.id !== customerId) {
        return NextResponse.json(
          formatResponse.error('A customer with this email already exists', 400),
          { status: 400 }
        );
      }
    }
    
    // Create context with user ID for audit
    const context = { 
      userId: request.auth?.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Update the customer
    const updatedCustomer = await customerService.update(customerId, data, { context });
    
    return NextResponse.json(
      formatResponse.success(updatedCustomer, 'Customer updated successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error updating customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId: params.id
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to update customer',
        500
      ),
      { status: 500 }
    );
  }
}
