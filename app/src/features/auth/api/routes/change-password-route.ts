/**
 * Change Password API Route Handler
 * 
 * Processes password change requests for authenticated users
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { IUserService } from '@/domain/services/IUserService';

/**
 * Handles password change requests
 */
export async function changePasswordHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  
  try {
    // Parse the request body
    const { currentPassword, newPassword, confirmPassword } = await req.json();
    
    // Validate inputs
    if (!currentPassword) {
      return NextResponse.json(
        formatResponse.error('Current password is required', 400),
        { status: 400 }
      );
    }
    
    if (!newPassword) {
      return NextResponse.json(
        formatResponse.error('New password is required', 400),
        { status: 400 }
      );
    }
    
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        formatResponse.error('New passwords do not match', 400),
        { status: 400 }
      );
    }
    
    // Get user ID from the auth context
    const userIdHeader = req.headers.get('x-user-id');
    if (!userIdHeader) {
      return NextResponse.json(
        formatResponse.error('User ID not found', 401),
        { status: 401 }
      );
    }
    
    // Parse user ID and prepare options
    const userId = parseInt(userIdHeader, 10);
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Get the user service instance
    let userService: IUserService | null = null;
    try {
      const serviceFactory = getServiceFactory();
      userService = serviceFactory.createUserService();
    } catch (serviceError) {
      logger.error('Failed to create UserService', {
        error: serviceError instanceof Error ? serviceError.message : String(serviceError),
        stack: serviceError instanceof Error ? serviceError.stack : undefined
      });
      
      return NextResponse.json(
        formatResponse.error('Internal server error', 500),
        { status: 500 }
      );
    }
    
    // Create change password data
    const passwordData = {
      currentPassword,
      newPassword,
      confirmPassword
    };
    
    // Create service options
    const options = {
      userId,
      ip: ipAddress,
      context: {
        userId,
        ipAddress
      }
    };
    
    // Call the user service's changePassword method
    const result = await userService.changePassword(userId, passwordData, options);
    
    // Check the result
    if (result === false) {
      throw new Error('Failed to change password');
    }
    
    logger.info(`Password changed successfully for user ${userId}`);
    
    // Return success response
    return NextResponse.json(
      formatResponse.success({}, 'Password has been changed successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error changing password', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.auth?.userId
    });
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('incorrect') || error.message.toLowerCase().includes('falsches passwort')) {
        return NextResponse.json(
          formatResponse.error('The current password is incorrect', 400),
          { status: 400 }
        );
      } else if (error.message.includes('requirements')) {
        return NextResponse.json(
          formatResponse.error('The new password does not meet the security requirements', 400),
          { status: 400 }
        );
      } else if (error.message.includes('match')) {
        return NextResponse.json(
          formatResponse.error('The new passwords do not match', 400),
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to change password',
        500
      ),
      { status: 500 }
    );
  }
}