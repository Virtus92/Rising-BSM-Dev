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
 * Standardized implementation using a consistent approach:
 * 1. HTTP-only cookies for primary security (auth_token & refresh_token)
 * 2. js_token cookie for javascript access (not HTTP-only)
 * 3. Response body (for client-side JavaScript access)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID().substring(0, 8);
  
  logger.debug('Token API called', {
    requestId,
    url: req.url
  });
  
  const startTime = performance.now();
  
  try {
    // Get cookie store
    const cookieStore = await cookies();
    
    // Try to get token from cookies in priority order
    const authToken = cookieStore.get('auth_token')?.value;
    const jsToken = cookieStore.get('js_token')?.value;
    const accessToken = cookieStore.get('access_token')?.value;
    
    // Get the first valid token
    const token = authToken || jsToken || accessToken;
    
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
    
    // Valid token found - calculate processing time
    const processingTime = Math.round(performance.now() - startTime);
    
    logger.debug('Token retrieved successfully', {
      requestId,
      processingTimeMs: processingTime,
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
