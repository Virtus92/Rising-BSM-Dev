/**
 * Token Validation API-Route
 * 
 * Validiert Reset-Tokens und andere Einmal-Tokens.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess } from '@/infrastructure/api/response-formatter';
import { getAuthService } from '@/infrastructure/common/factories';

/**
 * GET /api/auth/validate
 * 
 * Validates a token (e.g. for password reset) or validates the current auth token.
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  // Get token from query parameters
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  // Get the authentication service
  const authService = getAuthService();
  
  // If no token is provided in the query, validate the auth token from the cookie
  if (!token) {
    try {
      // Get authorization header
      const authHeader = req.headers.get('authorization');
      let authToken = null;
      
      // Extract token from Authorization header if present
      if (authHeader && authHeader.startsWith('Bearer ')) {
        authToken = authHeader.substring(7);
      } 
      
      // If no Authorization header, try to get the token from cookies
      if (!authToken) {
        const cookies = req.cookies;
        authToken = cookies.get('auth_token')?.value;
        
        // If still no token, try auth_token_access
        if (!authToken) {
          authToken = cookies.get('auth_token_access')?.value;
        }
      }
      
      // At this point, if no token is found, return a 400 error
      if (!authToken) {
        return NextResponse.json(
          {
            success: false,
            message: 'No authentication token found',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }
      
      // Validate the auth token
      const isValid = await authService.verifyToken(authToken);
      
      if (!isValid) {
        const response = NextResponse.json(
          {
            success: false,
            message: 'Invalid or expired authentication token',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
        
        // Delete all authentication cookies on invalid token
        response.cookies.delete('auth_token');
        response.cookies.delete('refresh_token');
        response.cookies.delete('auth_token_backup');
        response.cookies.delete('refresh_token_backup');
        
        return response;
      }
      
      // Token is valid, return success
      return NextResponse.json(
        formatSuccess({ valid: true }, 'Authentication token is valid'),
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error validating authentication token',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  }
  
  // Validate a specific token provided in the query parameter
  try {
    const isValid = await authService.verifyToken(token);
    
    if (!isValid) {
      const response = NextResponse.json(
      {
        success: false,
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
      );
      
      return response;
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error validating token',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
  
  // Format the response
  return NextResponse.json(
    formatSuccess({ valid: true }, 'Token is valid'),
    { status: 200 }
  );
}, { requiresAuth: false });