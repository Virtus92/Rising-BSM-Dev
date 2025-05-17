import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { cookies } from 'next/headers';
import { decodeAndValidateToken } from '@/features/auth/api/middleware/authMiddleware';

/**
 * Token API endpoint
 * 
 * Provides access to the current authentication token.
 * This endpoint is critical for client-side authentication.
 * 
 * The approach used here ensures tokens are sent in BOTH:
 * 1. HTTP-only cookies (for secure API requests)
 * 2. Response body (for client-side JavaScript access)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const requestId = crypto.randomUUID().substring(0, 8);
  
  logger.debug('Token API called', {
    requestId,
    url: req.url
  });
  
  try {
    // Try to get token from cookies - using await properly
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const accessToken = cookieStore.get('access_token')?.value;
    
    // Get the first valid token
    const token = authToken || accessToken;
    
    if (!token) {
      logger.warn('No auth token found in cookies', { requestId });
      
      // No token found, return empty success response
      return NextResponse.json(
        formatResponse.success({ token: null }),
        { status: 200 }
      );
    }
    
    // Validate token
    const validationResult = await decodeAndValidateToken(token);
    
    if (!validationResult.valid) {
      logger.warn('Invalid token found in cookies, returning null', {
        requestId,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
      });
      
      // Return null token but 200 status - client will handle refresh
      return NextResponse.json(
        formatResponse.success({ token: null }),
        { status: 200 }
      );
    }
    
    // Valid token found - return it in the response body to ensure client can access it
    // even if the cookies are HttpOnly
    logger.debug('Token retrieved successfully', {
      requestId,
      processingTimeMs: 0,
      tokenLength: token.length
    });
    
    // Include userId if available
    const responseData = {
      token,
      userId: validationResult.userId
    };
    
    // Return the token in response body - this is crucial for client-side access
    return NextResponse.json(
      formatResponse.success(responseData),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error retrieving token', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return error response
    return NextResponse.json(
      formatResponse.error('Error retrieving token', 500),
      { status: 500 }
    );
  }
}
