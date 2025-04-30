import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';

// Note: In a real implementation, this would be replaced with Redis or another persistent store
// import { redisClient } from '@/core/redis';

interface RateLimitOptions {
  // Maximum number of requests in the window
  maxRequests: number;
  
  // Time window in seconds
  windowSizeInSeconds: number;
  
  // Identifier function to determine which property to track (e.g., IP, username)
  identifierFn?: (req: NextRequest) => string;
  
  // Optional custom response when rate limit is exceeded
  customResponse?: (retryAfter: number) => NextResponse;
}

/**
 * In-memory store for rate limiting (development/testing only)
 * This should be replaced with Redis or another distributed store in production
 */
const rateLimitStore = new Map<string, {
  count: number;
  resetTime: number;
}>();

/**
 * Rate limiting middleware for API routes
 * Designed to work with a distributed storage system
 * 
 * @param options Rate limiting options
 * @returns Middleware function for rate limiting
 */
export function rateLimiter(options: RateLimitOptions) {
  const logger = getLogger();
  
  // Default identifier function uses IP address
  const getIdentifier = options.identifierFn || 
    ((req: NextRequest) => req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'unknown');
  
  return async function(req: NextRequest): Promise<NextResponse | null> {
    try {
      const identifier = getIdentifier(req);
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      
      // In a production environment, this would use Redis or another distributed store
      // const rateLimitKey = `ratelimit:${identifier}`;
      
      // Get current count and reset time from store or initialize
      let count = 0;
      let resetTime = now + options.windowSizeInSeconds;
      
      const record = rateLimitStore.get(identifier);
      if (record) {
        // If the reset time has passed, start a new window
        if (now >= record.resetTime) {
          count = 1;
          resetTime = now + options.windowSizeInSeconds;
        } else {
          count = record.count + 1;
          resetTime = record.resetTime;
        }
      }
      
      // Store updated values
      rateLimitStore.set(identifier, {
        count,
        resetTime
      });
      
      // With Redis, this would use INCRBY and EXPIRE in a transaction
      // For example:
      // const multi = redisClient.multi();
      // multi.incr(rateLimitKey);
      // multi.expire(rateLimitKey, options.windowSizeInSeconds);
      // const results = await multi.exec();
      // count = results[0];
      
      // Set rate limit headers
      const remaining = Math.max(0, options.maxRequests - count);
      const reset = resetTime - now;
      
      // Check if rate limit is exceeded
      if (count > options.maxRequests) {
        logger.warn('Rate limit exceeded', {
          identifier,
          path: req.nextUrl.pathname,
          count,
          limit: options.maxRequests
        });
        
        // Use custom response if provided
        if (options.customResponse) {
          return options.customResponse(reset);
        }
        
        // Default response
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: reset
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(reset),
              'X-RateLimit-Limit': String(options.maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(resetTime)
            }
          }
        );
      }
      
      // Request is allowed, continue
      return null;
    } catch (error) {
      logger.error('Error in rate limiter middleware', { 
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Don't block requests if rate limiter fails
      return null;
    }
  };
}

/**
 * Rate limiting middleware for general API endpoints
 */
export const apiRateLimiter = rateLimiter({
  maxRequests: 60,               // 60 requests in 1 minute
  windowSizeInSeconds: 60
});

/**
 * Rate limiting middleware specifically for authentication endpoints
 * Uses stricter limits to prevent brute force attacks
 */
export const authRateLimiter = rateLimiter({
  maxRequests: 5,                // 5 requests in 1 minute
  windowSizeInSeconds: 60,
  identifierFn: (req: NextRequest) => {
    // Include path in identifier to separate login/register/etc.
    const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
    const path = req.nextUrl.pathname;
    return `auth:${ip}:${path}`;
  }
});

/**
 * Helper to apply rate limiting to an API route handler
 * 
 * @param handler The API route handler function
 * @param limiter The rate limiter middleware to use
 * @returns New handler function with rate limiting applied
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter = apiRateLimiter
) {
  return async function(req: NextRequest) {
    // Apply rate limiting
    const rateLimitResponse = await limiter(req);
    
    // If rate limit is exceeded, return the error response
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Otherwise, proceed with the original handler
    return handler(req);
  };
}

/**
 * Helper to apply authentication rate limiting to an API route handler
 * Useful for login, register, and other auth-related endpoints
 * 
 * @param handler The API route handler function
 * @returns New handler function with auth rate limiting applied
 */
export function withAuthRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, authRateLimiter);
}
