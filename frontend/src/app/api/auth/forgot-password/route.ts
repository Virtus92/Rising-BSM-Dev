/**
 * Forgot Password API-Route
 * 
 * Verarbeitet Anfragen zum Zurücksetzen des Passworts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * POST /api/auth/forgot-password
 * 
 * Sendet eine E-Mail mit einem Link zum Zurücksetzen des Passworts.
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  
  // Parse den Anfragekörper
  const { email } = await req.json();
  
  if (!email) {
    return NextResponse.json(
      {
        success: false,
        message: 'Email is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  try {
    // Use the AuthService to generate a reset token
    const authService = getAuthService();
    
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
      formatSuccess(
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
      formatSuccess(
        { email },
        'Password reset instructions have been sent to your email'
      ),
      { status: 200 }
    );
  }
}, { requiresAuth: false });