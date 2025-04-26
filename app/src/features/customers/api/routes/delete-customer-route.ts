/**
 * Delete Customer API Route Handler
 * 
 * Handles deleting a customer by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * Deletes a customer by ID
 * 
 * @param request - HTTP request
 * @param params - URL parameters including customer ID
 * @returns HTTP response
 */
export async function deleteCustomerHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Customer deletion attempted without authentication');
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
      SystemPermission.CUSTOMERS_DELETE
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.CUSTOMERS_DELETE}`);
      return NextResponse.json(
        formatResponse.error(
          `You don't have permission to delete customers`, 
          403
        ),
        { status: 403 }
      );
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
    
    // Check if this is a hard delete request
    const isHardDelete = request.nextUrl.searchParams.get('hard') === 'true';
    
    // Additional permission check for hard delete
    if (isHardDelete) {
      // Verify user has the special hard delete permission
      const hasHardDeletePermission = await permissionMiddleware.hasPermission(
        request.auth.userId,
        SystemPermission.CUSTOMERS_HARD_DELETE
      );
      
      if (!hasHardDeletePermission) {
        logger.warn(`Permission denied: User ${request.auth.userId} does not have permission to hard delete customers`);
        return NextResponse.json(
          formatResponse.error(
            `You don't have permission to permanently delete customers`,
            403
          ),
          { status: 403 }
        );
      }
    }
    
    // Create context with user ID for audit
    const context = { 
      userId: request.auth?.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Delete the customer
    let success: boolean;
    if (isHardDelete) {
      success = await customerService.hardDelete(customerId, { context });
    } else {
      success = await customerService.softDelete(customerId, { context });
    }
    
    if (!success) {
      return NextResponse.json(
        formatResponse.error('Failed to delete customer', 500),
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      formatResponse.success(null, 'Customer deleted successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error deleting customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId: params.id
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to delete customer',
        500
      ),
      { status: 500 }
    );
  }
}
