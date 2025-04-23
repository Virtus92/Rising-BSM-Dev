import { NextRequest } from 'next/server';
import { db } from '@/infrastructure/db';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { auth } from '@/app/api/auth/middleware/authMiddleware';
// Import permission constants
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { CommonStatus } from '@/domain/enums/CommonEnums';

/**
 * PATCH endpoint to update customer status
 * 
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns API response
 */
export const PATCH = apiRouteHandler(async (request: NextRequest, context: { params: { id: string } }) => {
  const logger = getLogger();
  
  // IMPORTANT: Await the params before using them to avoid Next.js App Router errors
  const params = await Promise.resolve(context.params);
  
  logger.debug('Customer status update requested', { 
    params,
    method: request.method,
    url: request.url
  });
  
  // Get ID from resolved params
  const { id } = params;
  
  if (!id || isNaN(Number(id))) {
    logger.warn('Invalid customer ID provided', { id });
    return formatError('Invalid customer ID', 400);
  }
  
  const customerId = Number(id);
  
  try {
    // Step 1: Authenticate the user using built-in auth function
    const authResult = await auth(request);
    
    if (!authResult.success || !authResult.user) {
      logger.warn('Authentication failed', { 
        message: authResult.message,
        status: authResult.status
      });
      return formatError(authResult.message || 'Authentication failed', authResult.status || 403);
    }
    
    const user = authResult.user;
    logger.debug('User authenticated successfully', { userId: user.id, role: user.role });
    
    // Step 2: Check if the user has the CUSTOMERS_EDIT permission
    // For admin users, automatically grant permission
    let hasPermission = false;
    
    if (user.role === 'admin') {
      hasPermission = true;
      logger.debug('Admin user - permission automatically granted');
    } else {
      try {
        // For non-admin users, check the permission in the database
        const permissionCode = SystemPermission.CUSTOMERS_EDIT.toString();
        
        const userPermission = await db.userPermission.findFirst({
          where: {
            userId: user.id,
            permission: {
              code: permissionCode
            }
          },
          include: {
            permission: true
          }
        });
        
        hasPermission = !!userPermission;
        logger.debug('Permission check result', { 
          userId: user.id, 
          permissionCode, 
          hasPermission,
          permissionFound: userPermission ? 'yes' : 'no'
        });
      } catch (permissionError) {
        logger.error('Error checking user permissions', {
          error: permissionError instanceof Error ? permissionError.message : 'Unknown error',
          userId: user.id
        });
        // Default to no permission on error
        hasPermission = false;
      }
    }
    
    if (!hasPermission) {
      logger.warn('User lacks required permission', { 
        userId: user.id, 
        requiredPermission: SystemPermission.CUSTOMERS_EDIT.toString() 
      });
      return formatError('You do not have permission to update customer status', 403);
    }
    
    // Step 3: Parse request body
    let body;
    try {
      body = await request.json();
      logger.debug('Request body parsed successfully', { body });
    } catch (parseError) {
      logger.error('Failed to parse request body', { 
        error: parseError instanceof Error ? parseError.message : 'Unknown error' 
      });
      return formatError('Invalid request body', 400);
    }
    
    const { status, note } = body;
    
    if (!status) {
      logger.warn('Status not provided in request');
      return formatError('Status is required', 400);
    }
    // Validate that the status is a valid CommonStatus enum value
    if (!Object.values(CommonStatus).includes(status as CommonStatus)) {
      logger.warn('Invalid status value provided', { status });
      return formatError(`Invalid status value: ${status}. Must be one of: ${Object.values(CommonStatus).join(', ')}`, 400);
    }
    
    // Step 4: Update customer status in the database
    
    // First verify the customer exists
    logger.debug('Verifying customer exists', { customerId });
    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!existingCustomer) {
      logger.warn('Customer not found', { customerId });
      return formatError(`Customer with ID ${id} not found`, 404);
    }
    
    // Skip update if status is the same
    if (existingCustomer.status === status) {
      logger.debug('Status is already set to the requested value, skipping update', {
        customerId,
        status
      });
      return formatSuccess(existingCustomer);
    }
    
    // Safely determine userId for updatedBy
    let userId = null;
    try {
      const userExists = await db.user.findUnique({
        where: { id: user.id },
        select: { id: true }
      });
      
      if (userExists) {
        userId = user.id;
      }
    } catch (userError) {
      logger.warn('Error verifying user for updatedBy field, using null instead', { 
        userId: user.id,
        error: userError instanceof Error ? userError.message : 'Unknown error'
      });
      // Continue with null userId
    }
    
    // Update customer status with improved error handling
    logger.debug('Updating customer status', { 
      customerId, 
      oldStatus: existingCustomer.status, 
      newStatus: status,
      updatedBy: userId 
    });
    
    try {
      // Prepare update data safely
      const updateData = { 
        status: status as CommonStatus,
        updatedAt: new Date()
      } as any;
      
      // Only add updatedBy if we have a valid user ID
      if (userId !== null) {
        updateData.updatedBy = userId;
      }
      
      const updatedCustomer = await db.customer.update({
        where: { id: customerId },
        data: updateData
      });
      
      // Step 5: If note was provided, add it to customer logs
      if (note && note.trim()) {
        logger.debug('Adding customer log entry for status change', { customerId, note });
        
        try {
          await db.customerLog.create({
            data: {
              customerId,
              userId: userId, 
              userName: user.name || 'System',
              action: 'STATUS_CHANGE',
              details: note,
              createdAt: new Date()
            }
          });
        } catch (logError) {
          // Don't fail the whole request if just the log entry fails
          logger.error('Failed to create customer log entry, but status was updated', {
            error: logError instanceof Error ? logError.message : 'Unknown error',
            customerId
          });
        }
      }
      
      logger.info('Customer status updated successfully', { 
        customerId, 
        oldStatus: existingCustomer.status,
        newStatus: status,
        updatedBy: userId
      });
      
      return formatSuccess(updatedCustomer);
    } catch (dbError) {
      // Improved database error handling
      logger.error('Database error updating customer status', {
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        stack: dbError instanceof Error ? dbError.stack : undefined,
        customerId,
        requestedStatus: status
      });
      
      // Provide a more specific error message if possible
      if (dbError instanceof Error) {
        const errorMessage = dbError.message;
        
        if (errorMessage.includes('Foreign key constraint')) {
          return formatError('Status update failed: Database constraint violation', 500);
        }
        
        if (errorMessage.includes('not found')) {
          return formatError(`Customer with ID ${id} not found`, 404);
        }
        
        return formatError(`Database error: ${errorMessage}`, 500);
      }
      
      return formatError('Database error occurred while updating customer status', 500);
    }
  } catch (error) {
    logger.error('Error updating customer status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      customerId: id
    });
    
    return formatError('An error occurred while updating customer status', 500);
  }
});

/**
 * PUT endpoint to update customer status (for compatibility)
 * 
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns API response
 */
export const PUT = apiRouteHandler(async (request: NextRequest, context: { params: { id: string } }) => {
  const logger = getLogger();
  
  // IMPORTANT: Await the params here too for the PUT endpoint
  const params = await Promise.resolve(context.params);
  
  logger.debug('PUT request received for customer status', {
    params
  });
  
  // Delegate to PATCH handler for consistency
  return PATCH(request, context);
});
