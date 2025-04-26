/**
 * Validate Reset Token API Route Handler
 * 
 * Validates that a password reset token is valid and not expired.
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';

/**
 * Handles token validation requests
 */
export async function validateTokenHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  
  // Parse the request body
  const { token } = await req.json();
  
  if (!token) {
    return NextResponse.json(
      formatResponse.error('Token is required', 400),
      { status: 400 }
    );
  }
  
  try {
    // Get the auth service from the factory
    const serviceFactory = getServiceFactory();
    const authService = serviceFactory.createAuthService();
    
    // Validate the token
    const isValid = await authService.validateResetToken(token);
    
    logger.info(`Token validation result: ${isValid ? 'Valid' : 'Invalid'}`);
    
    // Return the validation result
    return NextResponse.json(
      formatResponse.success(
        { valid: isValid },
        isValid ? 'Token is valid' : 'Token is invalid or expired'
      ),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error validating token', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        'Error validating token',
        500
      ),
      { status: 500 }
    );
  }
}