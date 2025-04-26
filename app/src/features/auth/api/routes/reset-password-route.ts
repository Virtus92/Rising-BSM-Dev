/**
 * Reset Password API Route Handler
 * 
 * Processes password reset with a valid token
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';

/**
 * Handles password reset with a valid token
 */
export async function resetPasswordHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  // Parse the request body
  const { token, password, confirmPassword } = await req.json();
  
  // Validate inputs
  if (!token) {
    return NextResponse.json(
      formatResponse.error('Token is required', 400),
      { status: 400 }
    );
  }
  
  if (!password) {
    return NextResponse.json(
      formatResponse.error('Password is required', 400),
      { status: 400 }
    );
  }
  
  if (password !== confirmPassword) {
    return NextResponse.json(
      formatResponse.error('Passwords do not match', 400),
      { status: 400 }
    );
  }
  
  try {
    // Get the auth service from the factory
    const serviceFactory = getServiceFactory();
    const authService = serviceFactory.createAuthService();
    
    // First validate the token
    const isValidToken = await authService.validateResetToken(token);
    if (!isValidToken) {
      return NextResponse.json(
        formatResponse.error('Invalid or expired token', 400),
        { status: 400 }
      );
    }
    
    // Reset the password
    const result = await authService.resetPassword({
      token,
      password,
      confirmPassword,
      email: '' // The email will be determined from the token by the service
    });
    
    logger.info('Password reset successfully');
    
    // Return success response
    return NextResponse.json(
      formatResponse.success({}, 'Password has been reset successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error resetting password', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to reset password',
        error instanceof Error && error.message.includes('token') ? 400 : 500
      ),
      { status: error instanceof Error && error.message.includes('token') ? 400 : 500 }
    );
  }
}