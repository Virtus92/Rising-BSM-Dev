import { NextRequest } from 'next/server';
import { db } from '@/core/db';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/server/route-handler';
import { getLogger } from '@/core/logging';
import { auth } from '@/features/auth/api/index';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { CommonStatus } from '@/domain/enums/CommonEnums';

/**
 * PATCH endpoint to update customer status
 * 
 * @param request - Next.js request object
 * @returns API response
 */
export const PATCH = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  // Extract ID from URL path segments
  const urlParts = request.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 2]; // Take the second-to-last segment (the [id] part)
  
  if (!id || isNaN(Number(id))) {
    logger.warn('Invalid customer ID provided', { id });
    return formatResponse.error('Invalid customer ID', 400);
  }
  
  const customerId = Number(id);
  
  try {
    // Step 1: Authenticate the user - use direct JWT verification for reliability
    const { extractAuthToken } = await import('@/features/auth/api/middleware/authMiddleware');
    const token = await extractAuthToken(request);
    
    if (!token) {
      logger.warn('Authentication failed - no token provided');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
    let userId;
    let userRole;
    
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.verify(token, jwtSecret);
      userId = decoded.sub ? Number(decoded.sub) : null;
      userRole = typeof decoded === 'object' && 'role' in decoded ? decoded.role : undefined;
      
      if (!userId) {
        logger.warn('Invalid token - no user ID found');
        return formatResponse.error('Invalid authentication token', 401);
      }
    } catch (tokenError) {
      logger.error('Token verification failed', {
        error: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      });
      return formatResponse.error('Invalid or expired authentication token', 401);
    }
    
    logger.debug('User authenticated successfully', { userId, role: userRole });
    
    // Step 2: Check if the user has the CUSTOMERS_EDIT permission
    // For admin users, automatically grant permission
    let hasPermission = false;
    
    if (userRole === 'admin') {
      hasPermission = true;
      logger.debug('Admin user - permission automatically granted');
    } else {
      try {
        // For non-admin users, check the permission in the database
        const permissionCode = SystemPermission.CUSTOMERS_EDIT.toString();
        
        const userPermission = await db.userPermission.findFirst({
          where: {
            userId,
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
          userId, 
          permissionCode, 
          hasPermission,
          permissionFound: userPermission ? 'yes' : 'no'
        });
      } catch (permissionError) {
        logger.error('Error checking user permissions', {
          error: permissionError instanceof Error ? permissionError.message : 'Unknown error',
          userId
        });
        // Default to no permission on error
        hasPermission = false;
      }
    }
    
    if (!hasPermission) {
      logger.warn('User lacks required permission', { 
        userId, 
        requiredPermission: SystemPermission.CUSTOMERS_EDIT.toString() 
      });
      return formatResponse.error('You do not have permission to update customer status', 403);
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
      return formatResponse.error('Invalid request body', 400);
    }
    
    const { status, note } = body;
    
    if (!status) {
      logger.warn('Status not provided in request');
      return formatResponse.error('Status is required', 400);
    }
    // Validate that the status is a valid CommonStatus enum value
    if (!Object.values(CommonStatus).includes(status as CommonStatus)) {
      logger.warn('Invalid status value provided', { status });
      return formatResponse.error(`Invalid status value: ${status}. Must be one of: ${Object.values(CommonStatus).join(', ')}`, 400);
    }
    
    // Step 4: Update customer status in the database
    
    // First verify the customer exists
    logger.debug('Verifying customer exists', { customerId });
    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!existingCustomer) {
      logger.warn('Customer not found', { customerId });
      return formatResponse.error(`Customer with ID ${id} not found`, 404);
    }
    
    // Skip update if status is the same
    if (existingCustomer.status === status) {
      logger.debug('Status is already set to the requested value, skipping update', {
        customerId,
        status
      });
      return formatResponse.success(existingCustomer);
    }
    
    // Verify the userId exists in the database before using it as updatedBy
    let verifiedUserId = null;
    try {
      const userExists = await db.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (userExists) {
        verifiedUserId = userId;
      }
    } catch (userError) {
      logger.warn('Error verifying user for updatedBy field, using null instead', { 
        userId,
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
      const updateData: { 
        status: CommonStatus;
        updatedAt: Date;
        updatedBy?: number;
      } = { 
        status: status as CommonStatus,
        updatedAt: new Date()
      };
      
      // Only add updatedBy if we have a valid user ID
      if (verifiedUserId !== null) {
        updateData.updatedBy = verifiedUserId;
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
              userId: verifiedUserId, 
              userName: userRole ? (userRole === 'admin' ? 'Administrator' : userRole) : 'System',
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
      
      return formatResponse.success(updatedCustomer);
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
          return formatResponse.error('Status update failed: Database constraint violation', 500);
        }
        
        if (errorMessage.includes('not found')) {
          return formatResponse.error(`Customer with ID ${id} not found`, 404);
        }
        
        return formatResponse.error(`Database error: ${errorMessage}`, 500);
      }
      
      return formatResponse.error('Database error occurred while updating customer status', 500);
    }
  } catch (error) {
    logger.error('Error updating customer status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      customerId: id
    });
    
    return formatResponse.error('An error occurred while updating customer status', 500);
  }
});

/**
 * PUT endpoint to update customer status (for compatibility)
 * 
 * @param request - Next.js request object
 * @returns API response
 */
export const PUT = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  logger.debug('PUT request received for customer status');
  
  // Delegate to PATCH handler for consistency
  return PATCH(request);
});
