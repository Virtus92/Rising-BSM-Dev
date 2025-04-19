import { NextRequest } from 'next/server';
import { apiAuth } from '@/app/api/helpers/apiAuth';
import { CustomerService } from '@/infrastructure/services/CustomerService';
import { formatSuccessResponse, formatErrorResponse } from '@/infrastructure/api/response-formatter';
import { RouteHandler } from '@/infrastructure/api/route-handler';

// Import permission constants
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * PATCH endpoint to update customer status
 * 
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns API response
 */
export const PATCH = RouteHandler(async (request: NextRequest, context: { params: { id: string } }) => {
  const { id } = context.params;
  
  if (!id || isNaN(Number(id))) {
    return formatErrorResponse({
      statusCode: 400,
      message: 'Invalid customer ID'
    });
  }

  try {
    // Validate user has permission to update customer status
    const authCheck = await apiAuth(request, SystemPermission.CUSTOMERS_EDIT);
    if (!authCheck.success) {
      return formatErrorResponse({
        statusCode: 403,
        message: authCheck.message || 'Not authorized to update customer status'
      });
    }

    // Parse request body to get status and optional note
    const body = await request.json();
    const { status, note } = body;
    
    if (!status) {
      return formatErrorResponse({
        statusCode: 400,
        message: 'Status is required'
      });
    }
    
    // Update customer status through service
    const customer = await CustomerService.updateCustomer(Number(id), { status, ...(note ? { note } : {}) });
    
    if (!customer) {
      return formatErrorResponse({
        statusCode: 404, 
        message: `Customer with ID ${id} not found`
      });
    }
    
    return formatSuccessResponse(customer);
  } catch (error) {
    console.error('Error updating customer status:', error);
    return formatErrorResponse({
      statusCode: 500,
      message: 'An error occurred while updating customer status'
    });
  }
});

/**
 * PUT endpoint to update customer status (for compatibility)
 * 
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns API response
 */
export const PUT = RouteHandler(async (request: NextRequest, context: { params: { id: string } }) => {
  // Delegate to PATCH handler for consistency
  return PATCH(request, context);
});
