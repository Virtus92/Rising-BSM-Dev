/**
 * Token Validation API Route Handler
 * 
 * Validates authentication tokens or one-time tokens
 * Optimized for performance with reduced database load and proper caching
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';

// Tracking for rate limiting and optimization
const validationCounts: Record<string, { count: number, lastTime: number }> = {};
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const RATE_LIMIT_MAX = 10; // Max 10 validations per IP in 10 seconds

/**
 * Handles token validation requests with performance optimizations
 */
export async function validateHandler(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const logger = getLogger();
  
  // Get client IP for rate limiting
  const clientIp = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
  
  // Simple rate limiting for token validation
  if (clientIp !== 'unknown') {
    const clientData = validationCounts[clientIp] || { count: 0, lastTime: 0 };
    const now = Date.now();
    
    // Reset counter if the window has passed
    if (now - clientData.lastTime > RATE_LIMIT_WINDOW) {
      clientData.count = 0;
      clientData.lastTime = now;
    }
    
    // Increment counter
    clientData.count++;
    validationCounts[clientIp] = clientData;
    
    // Check for rate limit
    if (clientData.count > RATE_LIMIT_MAX) {
      logger.warn('Token validation rate limit exceeded', { clientIp, count: clientData.count });
      
      return NextResponse.json(
        formatResponse.error('Too many validation requests', 429),
        { 
          status: 429,
          headers: {
            'Retry-After': '10',
            'X-RateLimit-Limit': `${RATE_LIMIT_MAX}`,
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': `${Math.floor((clientData.lastTime + RATE_LIMIT_WINDOW) / 1000)}`
          }
        }
      );
    }
  }
  
  // Get token from query parameters
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const skipDetailedCheck = searchParams.get('quick') === 'true';
  
  // Generate a unique request ID for tracking
  const requestId = `validate-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  // Get the authentication service
  const serviceFactory = getServiceFactory();
  const authService = serviceFactory.createAuthService();
  
  // If no token is provided in the query, validate the auth token from the cookie
  if (!token) {
    try {
      // Get token with comprehensive checking of possible locations
      const authToken = extractAuthToken(req);
      
      // If no token is found, return a 400 error
      if (!authToken) {
        logger.debug('No authentication token found in request', { requestId });
        return NextResponse.json(
          formatResponse.error('No authentication token found', 400),
          { 
            status: 400,
            headers: {
              'Cache-Control': 'no-store, must-revalidate',
              'X-Request-ID': requestId
            }
          }
        );
      }
      
      // Validate the auth token with optimized performance option
      // Skip detailed database check for frequent validation calls
      const validation = await authService.verifyToken(authToken, {
        context: {
          detailed: !skipDetailedCheck,
          requestId,
          clientIp
        }
      });
      
      if (!validation.valid) {
        logger.debug('Token validation failed', { requestId, tokenPrefix: authToken.substring(0, 10) + '...' });
        
        const response = NextResponse.json(
          formatResponse.error('Invalid or expired authentication token', 401),
          { 
            status: 401,
            headers: {
              'Cache-Control': 'no-store, must-revalidate',
              'X-Request-ID': requestId
            }
          }
        );
        
        // Delete all authentication cookies on invalid token
        response.cookies.delete('auth_token');
        response.cookies.delete('auth_token_access');
        response.cookies.delete('access_token');
        response.cookies.delete('accessToken');
        response.cookies.delete('refresh_token');
        response.cookies.delete('refresh_token_access');
        response.cookies.delete('refreshToken');
        response.cookies.delete('refresh');
        
        return response;
      }
      
      // Calculate performance metrics
      const processingTime = Date.now() - startTime;
      
      // Token is valid, return success with appropriate cache headers
      // Allow short caching on successful validation to reduce load
      return NextResponse.json(
        formatResponse.success({ 
          valid: true,
          userId: validation.userId,
          processingTime,
          skipDetailedCheck
        }, 'Authentication token is valid'),
        { 
          status: 200,
          headers: {
            // Short cache time (60 seconds) for successful validations
            // This prevents excessive validation calls while still maintaining security
            'Cache-Control': 'private, max-age=60',
            'X-Request-ID': requestId
          }
        }
      );
    } catch (error) {
      logger.error('Error validating authentication token', { 
        error: error instanceof Error ? error.message : String(error),
        requestId
      });
      
      return NextResponse.json(
        formatResponse.error(
          'Error validating authentication token', 
          500
        ),
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'X-Request-ID': requestId
          }
        }
      );
    }
  }
  
  // Validate a specific token provided in the query parameter
  try {
    const validation = await authService.verifyToken(token, {
      context: {
        detailed: !skipDetailedCheck,
        requestId,
        clientIp
      }
    });
    
    if (!validation.valid) {
      logger.debug('Specific token validation failed', { requestId, tokenPrefix: token.substring(0, 10) + '...' });
      
      return NextResponse.json(
        formatResponse.error('Invalid or expired token', 400),
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'X-Request-ID': requestId
          }
        }
      );
    }
    
    // Calculate performance metrics
    const processingTime = Date.now() - startTime;
    
    // Format the successful response with appropriate cache headers
    return NextResponse.json(
      formatResponse.success({ 
        valid: true,
        userId: validation.userId,
        processingTime,
        skipDetailedCheck
      }, 'Token is valid'),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60',
          'X-Request-ID': requestId
        }
      }
    );
  } catch (error) {
    logger.error('Error validating token', { 
      error: error instanceof Error ? error.message : String(error),
      requestId
    });
    
    return NextResponse.json(
      formatResponse.error('Error validating token', 500),
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'X-Request-ID': requestId
        }
      }
    );
  }
}

/**
 * Helper function to extract auth token from various sources in the request
 * with comprehensive checking of all possible locations
 */
function extractAuthToken(req: NextRequest): string | null {
  // Check authorization header first (preferred method)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check custom headers used by middleware
  const headerToken = req.headers.get('x-auth-token');
  if (headerToken) {
    return headerToken;
  }
  
  // Check cookies with multiple possible names for better compatibility
  const cookies = req.cookies;
  const possibleCookieNames = [
    'auth_token',
    'auth_token_access',
    'access_token',
    'accessToken'
  ];
  
  for (const cookieName of possibleCookieNames) {
    const cookieValue = cookies.get(cookieName)?.value;
    if (cookieValue) {
      return cookieValue;
    }
  }
  
  // No token found
  return null;
}