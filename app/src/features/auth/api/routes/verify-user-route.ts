/**
 * User Verification API Route Handler
 * 
 * Verifies if a user exists and is active
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';

// Cache verification results to reduce database load
const verificationCache = new Map<string, {
  timestamp: number,
  user: { id: number, role: string, status: string }
}>();

// Cache TTL of 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Handles user verification requests
 * Supports both GET (from middleware) and POST (from API calls) methods
 */
export async function verifyUserHandler(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const requestId = request.headers.get('x-request-id') || `req-${Date.now()}`;
  
  try {
    // Handle both GET and POST methods
    let userId: string | null = null;
    
    if (request.method === 'GET') {
      // For GET requests, get userId from URL parameters
      const url = new URL(request.url);
      userId = url.searchParams.get('userId');
      logger.debug(`GET request with userId: ${userId || 'none'} (${requestId})`);
    } else {
      // For POST requests, get userId from request body
      try {
        const body = await request.json();
        userId = body.userId;
        logger.debug(`POST request with userId: ${userId || 'none'} (${requestId})`);
      } catch (parseError) {
        logger.error(`Error parsing request body (${requestId}):`, parseError instanceof Error ? parseError.message : 'Unknown error');
        return formatResponse.error({
          name: 'ParseError',
          message: 'Invalid request body - could not parse JSON',
          code: 'invalid_request',
          requestId
        } as Error, 400);
      }
    }
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required',
        errorCode: 'missing_parameter',
        timestamp: new Date().toISOString()
      }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'X-Request-ID': requestId
        }
      });
    }
    
    // Check cache first to reduce database load
    const cacheKey = `user-${userId}`;
    const cached = verificationCache.get(cacheKey);
    const now = Date.now();
    
    // Check if we should use cache
    if (cached && now - cached.timestamp < CACHE_TTL) {
      // Using cached result
      logger.debug(`Using cached verification for user ID: ${userId} (${requestId})`);
      
      const cachedUser = cached.user;
      
      // Return cached verification result
      const responseData = {
        success: true,
        message: 'User verified successfully (cached)',
        data: {
          user: {
            id: cachedUser.id,
            role: cachedUser.role,
            status: cachedUser.status
          }
        },
        timestamp: new Date().toISOString(),
        requestId
      };
      
      // Create response with cache headers
      const response = NextResponse.json(responseData);
      
      // Calculate remaining cache time
      const remainingTtl = Math.floor((CACHE_TTL - (now - cached.timestamp)) / 1000);
      
      // Add cache and performance headers
      response.headers.set('Cache-Control', `public, max-age=${remainingTtl}, s-maxage=${remainingTtl}`);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Request-ID', requestId);
      
      return response;
    }
    
    // Cache miss - retrieve from database
    logger.debug(`Cache miss - processing verification request for user ID: ${userId} (${requestId})`);
    
    // Get the user service
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get the user by ID
    const user = await userService.getById(Number(userId));
    
    // If user not found, return 404
    if (!user) {
      logger.warn(`User not found in verify-user endpoint: ${userId} (${requestId})`);
      return NextResponse.json({
        success: false,
        message: 'User not found',
        errorCode: 'not_found',
        timestamp: new Date().toISOString()
      }, { 
        status: 404,
        headers: {
          'Cache-Control': 'no-store',
          'X-Request-ID': requestId
        }
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      logger.warn(`Inactive user attempted access: ${userId}, status: ${user.status} (${requestId})`);
      return NextResponse.json({
        success: false,
        message: 'User account is not active',
        errorCode: 'inactive_account',
        timestamp: new Date().toISOString()
      }, { 
        status: 403,
        headers: {
          'Cache-Control': 'no-store',
          'X-Request-ID': requestId
        }
      });
    }
    
    // Store in cache
    verificationCache.set(cacheKey, {
      timestamp: now,
      user: {
        id: user.id,
        role: user.role,
        status: user.status
      }
    });
    
    // Create the response structure
    const responseData = {
      success: true,
      message: 'User verified successfully',
      data: {
        user: {
          id: user.id,
          role: user.role,
          status: user.status
        }
      },
      timestamp: new Date().toISOString()
    };
    
    // Add cache headers to the response
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', `public, max-age=${CACHE_TTL / 1000}, s-maxage=${CACHE_TTL / 1000}`);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-Request-ID', requestId);
    
    return response;
  } catch (error) {
    // Handle errors
    const errorInfo = error instanceof Error ? {
      name: error.name,
      message: error.message
    } : { message: String(error) };
      
    logger.error(`Error in verify-user endpoint (${requestId}):`, errorInfo);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${errorInfo.message}`,
      errorCode: 'server_error',
      timestamp: new Date().toISOString(),
      requestId
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'X-Request-ID': requestId
      }
    });
  }
}

// Export utility function for cache management
export function clearVerificationCache() {
  verificationCache.clear();
}
