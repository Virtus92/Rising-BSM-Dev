/**
 * Validate Reset Token API-Route
 * 
 * Validates that a password reset token is valid and not expired.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * POST /api/auth/validate-token
 * 
 * Validates a password reset token.
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  
  // Parse den Anfragekörper
  const { token } = await req.json();
  
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: 'Token is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  try {
    // Use the AuthService to validate the token
    const authService = getAuthService();
    
    // Validate the token
    const isValid = await authService.validateResetToken(token);
    
    logger.info(`Token validation result: ${isValid ? 'Valid' : 'Invalid'}`);
    
    // Return the validation result
    return NextResponse.json(
      formatSuccess(
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
      formatError(
        'Error validating token',
        500
      ),
      { status: 500 }
    );
  }
}, { requiresAuth: false });