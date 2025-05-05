/**
 * Update User API Route Handler
 * Handles updating a user by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { validateUserUpdate } from '@/core/validation';

/**
 * Handles PUT /api/users/[id] - Update user by ID
 */
export async function updateUserHandler(
  request: NextRequest, 
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  const userId = parseInt(params.id, 10);

  try {
    // Validate ID
    if (isNaN(userId)) {
      return formatResponse.error('Invalid user ID', 400);
    }

    // Validate authentication
    if (!request.auth?.userId) {
      return formatResponse.unauthorized('Authentication required');
    }
    
    // Parse request body
    const requestData = await request.json();
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Check if user exists
    const existingUser = await userService.getById(userId);
    if (!existingUser) {
      return formatResponse.notFound('User not found');
    }
    
    // Check permissions based on update type
    const isOwnProfile = request.auth.userId === userId;
    
    // Different permission checks based on what's being updated
    const isRoleChange = requestData.role && requestData.role !== existingUser.role;
    const isStatusChange = requestData.status && requestData.status !== existingUser.status;
    
    // For role or status changes, require USERS_MANAGE permission
    if ((isRoleChange || isStatusChange) && 
        !await permissionMiddleware.hasPermission(request.auth.userId, SystemPermission.USERS_MANAGE)) {
      return formatResponse.forbidden('You do not have permission to change user roles or status');
    }
    
    // For updating other users, require USERS_EDIT permission
    if (!isOwnProfile && 
        !await permissionMiddleware.hasPermission(request.auth.userId, SystemPermission.USERS_EDIT)) {
      return formatResponse.forbidden('You do not have permission to edit this user');
    }
    
    // For updating own profile, some fields may be restricted
    let dataToUpdate = requestData;
    if (isOwnProfile) {
      // Users can't change their own role or status
      if (isRoleChange || isStatusChange) {
        return formatResponse.forbidden('You cannot change your own role or status');
      }
      
      // Remove restricted fields from self-updates
      const { role, status, ...allowedData } = requestData;
      dataToUpdate = allowedData;
    }
    
    // Validate update data
    const validationResult = validateUserUpdate(dataToUpdate);
    
    if (!validationResult.valid) {
      // Convert validation errors to array to match the expected format
      let errorsArray: string[] = [];
      if (typeof validationResult.errors === 'object' && validationResult.errors !== null) {
        Object.entries(validationResult.errors).forEach(([field, message]) => {
          errorsArray.push(`${field}: ${message}`);
        });
      } else if (Array.isArray(validationResult.errors)) {
        errorsArray = validationResult.errors;
      } else if (typeof validationResult.errors === 'string') {
        errorsArray = [validationResult.errors];
      }
      
      return formatResponse.validationError(errorsArray);
    }
    
    // Create context with user ID for audit
    const context = { 
      userId: request.auth?.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Prepare data for update - handle profilePictureId type issue
    const preparedData = { ...dataToUpdate };
    
    // If profilePictureId is a string but should be an integer or null
    if (typeof preparedData.profilePictureId === 'string') {
      // Convert to integer if it's a numeric string
      if (/^\d+$/.test(preparedData.profilePictureId)) {
        preparedData.profilePictureId = parseInt(preparedData.profilePictureId, 10);
      } else {
        // If it's a filename string and not a numeric ID, remove it
        // We'll keep the profilePicture path instead
        delete preparedData.profilePictureId;
      }
    }
    
    // Update the user
    const updatedUser = await userService.update(userId, preparedData, { context });
    
    return formatResponse.success(updatedUser, 'User updated successfully');
  } catch (error) {
    logger.error('Error updating user:', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to update user',
      500
    );
  }
}