/**
 * Reset Password API-Route
 * 
 * Verarbeitet Anfragen zum Setzen eines neuen Passworts nach einem Reset.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * POST /api/auth/reset-password
 * 
 * Setzt das Passwort mit einem gültigen Reset-Token zurück.
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Parse den Anfragekörper
  const { token, password, confirmPassword } = await req.json();
  
  // Validiere die Eingaben
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
  
  if (!password) {
    return NextResponse.json(
      {
        success: false,
        message: 'Password is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  if (password !== confirmPassword) {
    return NextResponse.json(
      {
        success: false,
        message: 'Passwords do not match',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  try {
    // Use the AuthService to reset the password
    const authService = getAuthService();
    
    // First validate the token
    const isValidToken = await authService.validateResetToken(token);
    if (!isValidToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString()
        },
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
      formatSuccess({}, 'Password has been reset successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error resetting password', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatError(
        error instanceof Error ? error.message : 'Failed to reset password',
        error instanceof Error && error.message.includes('token') ? 400 : 500
      ),
      { status: error instanceof Error && error.message.includes('token') ? 400 : 500 }
    );
  }
}, { requiresAuth: false });