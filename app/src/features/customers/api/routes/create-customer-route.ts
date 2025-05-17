/**
 * Create Customer API Route Handler
 * 
 * Handles creating a new customer
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { CustomerStatus } from '@/domain/enums/CommonEnums';

/**
 * Creates a new customer
 * 
 * @param request - HTTP request
 * @returns HTTP response
 */
export async function createCustomerHandler(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Customer creation attempted without authentication');
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }
    
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.CUSTOMERS_CREATE
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.CUSTOMERS_CREATE}`);
      return NextResponse.json(
        formatResponse.error(
          `You don't have permission to create customers`, 
          403
        ),
        { status: 403 }
      );
    }

    // Parse request body
    const data = await request.json();
    
    // Basic validation
    if (!data.name || !data.email) {
      return NextResponse.json(
        formatResponse.error(
          'Name and email are required fields',
          400
        ),
        { status: 400 }
      );
    }
    
    // Email validation
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
    
    // Set default values if not provided
    if (!data.status) {
      data.status = CustomerStatus.ACTIVE;
    }
    
    // Get customer service from service factory
    const customerService = serviceFactory.createCustomerService();
    
    // Check if email already exists
    const existingCustomer = await customerService.findByEmail(data.email);
    
    if (existingCustomer) {
      return NextResponse.json(
        formatResponse.error('A customer with this email already exists', 400),
        { status: 400 }
      );
    }
    
    // Create context with user ID for audit
    const context = { 
      userId: request.auth?.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Create the customer
    const newCustomer = await customerService.create(data, { context });
    
    return NextResponse.json(
      formatResponse.success(newCustomer, 'Customer created successfully', 201),
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating customer:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to create customer',
        500
      ),
      { status: 500 }
    );
  }
}
