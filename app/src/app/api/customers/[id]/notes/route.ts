import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/core/errors/index';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';
import { withPermission } from '@/app/api/helpers/apiPermissions';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { validateId } from '@/shared/utils/validation-utils';

/**
 * POST /api/customers/[id]/notes
 * 
 * Adds a note to a customer
 * Requires CUSTOMERS_EDIT permission
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Extract ID from URL path
  const params = { id: req.nextUrl.pathname.split('/').slice(-2)[0] };
  
  try {
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.CUSTOMERS_EDIT
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.CUSTOMERS_EDIT}`);
      return formatError(
        `You don't have permission to add notes to customers`, 
        403
      );
    }
    
    const id = params.id;
    
    if (!id) {
      logger.error('Missing customer ID');
      return formatError('Customer ID is required', 400);
    }
    
    // Validate and sanitize ID
    const customerId = validateId(id);
    if (customerId === null) {
      logger.error(`Invalid customer ID: ${id}`);
      return formatError('Invalid customer ID format', 400);
    }
    
    // Parse request body as JSON
    const data = await req.json();
    
    if (!data.text && !data.note) {
      return formatValidationError({
        text: ['Note text is required']
      }, 'Invalid note data');
    }
    
    // Get services from service factory
    const serviceFactory = getServiceFactory();
    const customerService = serviceFactory.createCustomerService();
    
    // Check if customer exists
    const customer = await customerService.getById(customerId);
    if (!customer) {
      return formatNotFound('Customer not found');
    }
    
    // Get user context for the service call
    const context = {
      userId: req.auth?.userId,
      userName: req.auth?.name || 'Unknown User'
    };
    
    // Add the note using customer service
    const customerLog = await customerService.createCustomerLog(
      customerId,
      'NOTE',
      data.text || data.note,
      { context }
    );
    
    // Format and return the note
    const note = {
      id: customerLog.id,
      customerId: customerLog.customerId,
      userId: customerLog.userId,
      userName: customerLog.userName,
      text: customerLog.details,
      createdAt: customerLog.createdAt,
      formattedDate: new Date(customerLog.createdAt).toLocaleString()
    };
    
    return formatSuccess(note, 'Note added successfully', 201);
    
  } catch (error) {
    logger.error('Error adding customer note:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error adding note to customer',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * GET /api/customers/[id]/notes
 * 
 * Retrieves notes for a customer
 * Requires CUSTOMERS_VIEW permission
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Extract ID from URL path
  const params = { id: req.nextUrl.pathname.split('/').slice(-2)[0] };
  
  try {
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.CUSTOMERS_VIEW
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.CUSTOMERS_VIEW}`);
      return formatError(
        `You don't have permission to view customer notes`, 
        403
      );
    }
    
    const id = params.id;
    
    if (!id) {
      logger.error('Missing customer ID');
      return formatError('Customer ID is required', 400);
    }
    
    // Validate and sanitize ID
    const customerId = validateId(id);
    if (customerId === null) {
      logger.error(`Invalid customer ID: ${id}`);
      return formatError('Invalid customer ID format', 400);
    }
    
    // Get services from service factory
    const serviceFactory = getServiceFactory();
    const customerService = serviceFactory.createCustomerService();
    
    // Check if customer exists
    const customer = await customerService.getById(customerId);
    if (!customer) {
      return formatNotFound('Customer not found');
    }
    
    // Get customer logs that are notes using customer service
    const logs = await customerService.getCustomerLogs(customerId, {
      filters: { action: 'NOTE' }
    });
    
    // Map logs to notes format with consistent fields
    const notes = logs.map(log => ({
      id: log.id,
      customerId: log.customerId,
      userId: log.userId,
      userName: log.userName,
      text: log.details, // Keep using details as text
      details: log.details, // Also include details field for consistency
      createdAt: log.createdAt,
      formattedDate: new Date(log.createdAt).toLocaleString()
    }));
    
    return formatSuccess(notes, 'Customer notes retrieved successfully');
    
  } catch (error) {
    logger.error('Error fetching customer notes:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error retrieving customer notes',
      500
    );
  }
}, {
  requiresAuth: true
});