/**
 * Change Password API-Route
 * 
 * Verarbeitet Anfragen zum Ändern des Passworts für angemeldete Benutzer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';
import { getUserService } from '@/infrastructure/common/factories';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * POST /api/auth/change-password
 * 
 * Ändert das Passwort eines angemeldeten Benutzers.
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  
  // Parse den Anfragekörper
  const { currentPassword, newPassword, newPasswordConfirm } = await req.json();
  
  // Validiere die Eingaben
  if (!currentPassword) {
    return NextResponse.json(
      {
        success: false,
        message: 'Current password is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  if (!newPassword) {
    return NextResponse.json(
      {
        success: false,
        message: 'New password is required',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  if (newPassword !== newPasswordConfirm) {
    return NextResponse.json(
      {
        success: false,
        message: 'New passwords do not match',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  try {
    // Ensure user is authenticated
    if (!req.auth?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }
    
    const userId = req.auth.userId;
    
    // Use the UserService to change the password
    const userService = getUserService();
    
    // Change the password
    const result = await userService.changePassword(userId, {
      currentPassword,
      newPassword,
      confirmPassword: newPasswordConfirm
    }, {
      context: {
        userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    logger.info(`Password changed successfully for user ${userId}`);
    
    // Return success response
    return NextResponse.json(
      formatSuccess({}, 'Password has been changed successfully'),
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
      if (error.message.includes('incorrect')) {
        return NextResponse.json(
          formatError('Current password is incorrect', 400),
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      formatError(
        error instanceof Error ? error.message : 'Failed to change password',
        500
      ),
      { status: 500 }
    );
  }
}, {
  // Nur angemeldete Benutzer dürfen ihr Passwort ändern
  requiresAuth: true
});