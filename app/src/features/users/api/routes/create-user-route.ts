/**
 * Create User API Route Handler
 * Handles creating a new user
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { validateUserCreate } from '@/core/validation';

/**
 * Handles POST /api/users - Create a new user
 */
export async function createUserHandler(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('User creation attempted without authentication');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.USERS_CREATE
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.USERS_CREATE}`);
      return formatResponse.error(
        `You don't have permission to create users`, 
        403
      );
    }

    // Parse request body
    const data = await request.json();
    
    // Validate input data
    const validationResult = validateUserCreate(data);
    
    if (!validationResult.valid) {
      return formatResponse.error(
        `Validation failed: ${Object.values(validationResult.errors).join(', ')}`,
        400
      );
    }
    
    // Get user service from service factory
    const userService = serviceFactory.createUserService();
    
    // Check if email already exists
    const existingUser = await userService.findByEmail(data.email);
    
    if (existingUser) {
      return formatResponse.error('Email already in use', 400);
    }
    
    // Create context with user ID for audit
    const context = { 
      userId: request.auth?.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Create the user
    const newUser = await userService.create(data, { context });
    
    return formatResponse.success(newUser, 'User created successfully', 201);
  } catch (error) {
    logger.error('Error creating user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to create user',
      500
    );
  }
}