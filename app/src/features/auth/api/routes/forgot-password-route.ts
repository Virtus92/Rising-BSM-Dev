/**
 * Forgot Password API-Route Handler
 * 
 * Processes password reset requests and sends reset emails.
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';

/**
 * Handles forgot password requests
 */
export async function forgotPasswordHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  
  // Parse the request body
  const { email } = await req.json();
  
  if (!email) {
    return NextResponse.json(
      formatResponse.error('Email is required', 400),
      { status: 400 }
    );
  }
  
  try {
    // Get the auth service from the factory
    const serviceFactory = getServiceFactory();
    const authService = serviceFactory.createAuthService();
    
    // Request password reset
    const result = await authService.forgotPassword({ 
      email 
    }, {
      context: {
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // Log the action (note: we don't log whether the email exists for security reasons)
    logger.info(`Password reset requested for email: ${email}`);
    
    // Always return success, even if email doesn't exist (security best practice)
    return NextResponse.json(
      formatResponse.success(
        { email },
        'Password reset instructions have been sent to your email'
      ),
      { status: 200 }
    );
  } catch (error) {
    // Log the error but don't expose details to the client
    logger.error('Error processing password reset request', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      email
    });
    
    // Still return success - don't leak information about whether an email exists
    return NextResponse.json(
      formatResponse.success(
        { email },
        'Password reset instructions have been sent to your email'
      ),
      { status: 200 }
    );
  }
}