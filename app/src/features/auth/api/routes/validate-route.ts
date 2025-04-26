/**
 * Token Validation API Route Handler
 * 
 * Validates authentication tokens or one-time tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';

/**
 * Handles token validation requests
 */
export async function validateHandler(req: NextRequest): Promise<NextResponse> {
  // Get token from query parameters
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  // Get the authentication service
  const serviceFactory = getServiceFactory();
  const authService = serviceFactory.createAuthService();
  
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
          formatResponse.error('No authentication token found', 400),
          { status: 400 }
        );
      }
      
      // Validate the auth token
      const isValid = await authService.verifyToken(authToken);
      
      if (!isValid) {
        const response = NextResponse.json(
          formatResponse.error('Invalid or expired authentication token', 401),
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
        formatResponse.success({ valid: true }, 'Authentication token is valid'),
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        formatResponse.error(
          'Error validating authentication token', 
          500
        ),
        { status: 500 }
      );
    }
  }
  
  // Validate a specific token provided in the query parameter
  try {
    const isValid = await authService.verifyToken(token);
    
    if (!isValid) {
      const response = NextResponse.json(
        formatResponse.error('Invalid or expired token', 400),
        { status: 400 }
      );
      
      return response;
    }
  } catch (error) {
    return NextResponse.json(
      formatResponse.error('Error validating token', 500),
      { status: 500 }
    );
  }
  
  // Format the response
  return NextResponse.json(
    formatResponse.success({ valid: true }, 'Token is valid'),
    { status: 200 }
  );
}