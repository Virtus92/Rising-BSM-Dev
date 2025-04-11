import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * GET /api/customers/[id]
 * 
 * Retrieves a single customer by ID
 */
export const GET = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    if (!params) {
      return formatError('No customer ID provided', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Invalid customer ID', 400);
    }
    
    // Get customer service from factory
    const customerService = serviceFactory.createCustomerService();
    
    // Retrieve customer with the specified ID
    const customer = await customerService.getById(id, {
      relations: ['appointments'],
      context: {
        userId: req.auth?.userId
      }
    });
    
    if (!customer) {
      return formatNotFound('Customer not found');
    }
    
    // Success response
    return formatSuccess(customer, 'Customer retrieved successfully');
    
  } catch (error) {
    logger.error('Error fetching customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId: params?.id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error retrieving the customer',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * PUT /api/customers/[id]
 * 
 * Updates a customer by ID
 */
export const PUT = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    if (!params) {
      return formatError('No customer ID provided', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Invalid customer ID', 400);
    }
    
    // Parse request body as JSON
    const data = await req.json() as UpdateCustomerDto;
    
    // Get customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Check if customer exists
    const existingCustomer = await customerService.getById(id);
    
    if (!existingCustomer) {
      return formatNotFound('Customer not found');
    }
    
    // Update customer
    const updatedCustomer = await customerService.update(id, data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // Success response
    return formatSuccess(updatedCustomer, 'Customer updated successfully');
    
  } catch (error) {
    logger.error('Error updating customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId: params?.id
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
        'Customer validation failed'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Error updating the customer',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * DELETE /api/customers/[id]
 * 
 * Deletes a customer by ID
 */
export const DELETE = apiRouteHandler(async (req: NextRequest, params?: { [key: string]: string }) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    if (!params) {
      return formatError('No customer ID provided', 400);
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return formatError('Invalid customer ID', 400);
    }
    
    // Get customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Check if customer exists
    const existingCustomer = await customerService.getById(id);
    
    if (!existingCustomer) {
      return formatNotFound('Customer not found');
    }
    
    // Delete customer
    const deleted = await customerService.delete(id, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // Success response
    return formatSuccess({ deleted }, 'Customer deleted successfully');
    
  } catch (error) {
    logger.error('Error deleting customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      customerId: params?.id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error deleting the customer',
      500
    );
  }
}, {
  requiresAuth: true
});
