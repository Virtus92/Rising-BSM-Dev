/**
 * Change Password API Route Handler
 * 
 * Processes password change requests for authenticated users
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';

/**
 * Handles password change requests
 */
export async function changePasswordHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  
  // Parse the request body
  const { currentPassword, newPassword, confirmPassword } = await req.json();
  // For backward compatibility
  const newPasswordConfirm = confirmPassword;
  
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
  
  try {
    // Ensure user is authenticated
    // In the new structure, we'll need to get the userId from the token
    // This might be handled by middleware in the actual route
    // For now, let's extract it from the headers
    const authHeader = req.headers.get('authorization');
    let userId: number | null = null;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }
    
    // In a real implementation, we'd decode the token to get the userId
    // For now, we'll assume the userId is passed as a header for simplicity
    const userIdHeader = req.headers.get('x-user-id');
    if (!userIdHeader) {
      return NextResponse.json(
        formatResponse.error('User ID not found', 401),
        { status: 401 }
      );
    }
    
    userId = parseInt(userIdHeader, 10);
    
    // Use the UserService to change the password
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Change the password
    const result = await userService.changePassword(userId, {
      currentPassword,
      newPassword,
      confirmPassword
    }, {
      context: {
        userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
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