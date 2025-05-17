/**
 * Token Validation API Route Handler
 * 
 * Validates authentication tokens or one-time tokens
 * Optimized for performance with reduced database load and proper caching
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { securityConfig } from '@/core/config/SecurityConfig';
import { getUserRepository } from '@/core/factories/repositoryFactory.server';

// Mark as server-only to prevent client imports
import 'server-only';

// Tracking for rate limiting and optimization
const validationCounts: Record<string, { count: number, lastTime: number }> = {};
const RATE_LIMIT_WINDOW = 60000; // 60 seconds
const RATE_LIMIT_MAX = 100; // Significantly increased to prevent false rate limiting

/**
 * Handles token validation requests with performance optimizations
 */
export async function validateHandler(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const logger = getLogger();
  
  // Generate a unique request ID for tracking
  const requestId = `validate-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
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
  const tokenParam = searchParams.get('token');
  const skipDetailedCheck = searchParams.get('quick') === 'true';
  
  try {
    // Determine which token to validate (from param or auth headers/cookies)
    let tokenToValidate: string | undefined;
    
    if (tokenParam) {
      // Use token from query param if provided
      tokenToValidate = tokenParam;
    } else {
      // Otherwise extract from auth headers/cookies
      tokenToValidate = await extractAuthToken(req);
    }
    
    // If no token is found, return a 400 error
    if (!tokenToValidate) {
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
    
    // Validate the token
    try {
      // Verify token signature
      const decoded = verify(tokenToValidate, securityConfig.getJwtSecret()) as any;
      
      // Check expiration
      const expiresAt = new Date(decoded.exp * 1000);
      if (Date.now() >= expiresAt.getTime()) {
        logger.debug('Token expired', { requestId });
        return NextResponse.json(
          formatResponse.error('Token expired', 401),
          { status: 401 }
        );
      }
      
      // Extract user ID
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else {
        userId = parseInt(decoded.sub, 10);
        if (isNaN(userId)) {
          logger.debug('Invalid user ID in token', { requestId });
          return NextResponse.json(
            formatResponse.error('Invalid token format', 401),
            { status: 401 }
          );
        }
      }
      
      // If not skipping detailed checks, verify user exists and is active
      if (!skipDetailedCheck) {
        try {
          const userRepository = getUserRepository();
          const user = await userRepository.findById(userId);
          
          if (!user || user.status !== 'active') {
            logger.debug('User not found or not active', { requestId, userId });
            return NextResponse.json(
              formatResponse.error('User not found or not active', 401),
              { status: 401 }
            );
          }
        } catch (repoError) {
          logger.error('Error checking user repository:', repoError as Error);
          // If in quick mode, continue even if we can't check the user
          if (!skipDetailedCheck) {
            return NextResponse.json(
              formatResponse.error('Error validating user', 500),
              { status: 500 }
            );
          }
        }
      }
      
      // Calculate performance metrics
      const processingTime = Date.now() - startTime;
      
      // Token is valid, return success with simpler response format
      return NextResponse.json(
        { 
          success: true,
          data: {
            valid: true,
            userId,
            role: decoded.role,
            processingTime,
            skipDetailedCheck
          },
          message: 'Token is valid'
        },
        { 
          status: 200,
          headers: {
            // Short cache time (60 seconds) for successful validations
            'Cache-Control': 'private, max-age=60',
            'X-Request-ID': requestId
          }
        }
      );
    } catch (jwtError) {
      logger.debug('Token validation failed', { 
        requestId,
        error: jwtError instanceof Error ? jwtError.message : String(jwtError)
      });
      
      if (tokenToValidate) {
        logger.debug('Token validation failed', { 
          requestId, 
          tokenPrefix: tokenToValidate.substring(0, 10) + '...'
        });
      }
      
      const response = NextResponse.json(
        formatResponse.error('Invalid or expired token', 401),
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'X-Request-ID': requestId
          }
        }
      );
      
      return response;
    }
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
async function extractAuthToken(req: NextRequest): Promise<string | undefined> {
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
  
  // Check server-side cookies (properly awaited)
  try {
    const cookieStore = await cookies();
    
    const authToken = cookieStore.get('auth_token')?.value;
    if (authToken) return authToken;
    
    const authTokenAccess = cookieStore.get('auth_token_access')?.value;
    if (authTokenAccess) return authTokenAccess;
    
    const accessToken = cookieStore.get('access_token')?.value;
    if (accessToken) return accessToken;
    
    const accessTokenAlt = cookieStore.get('accessToken')?.value;
    if (accessTokenAlt) return accessTokenAlt;
  } catch (error) {
    // Fall back to request cookies if server-side cookies fail
    const logger = getLogger();
    logger.warn('Error accessing server-side cookies, falling back to request cookies', error as Error);
  }
  
  // Check cookies with multiple possible names for better compatibility
  // This is a fallback in case the server-side cookie access fails
  const reqCookies = req.cookies;
  const possibleCookieNames = [
    'auth_token',
    'auth_token_access',
    'access_token',
    'accessToken'
  ];
  
  for (const cookieName of possibleCookieNames) {
    const cookieValue = reqCookies.get(cookieName)?.value;
    if (cookieValue) {
      return cookieValue;
    }
  }
  
  // No token found
  return undefined;
}