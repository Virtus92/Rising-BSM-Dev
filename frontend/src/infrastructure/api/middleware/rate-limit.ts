import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/infrastructure/common/logging';

interface RateLimitOptions {
  // Maximum number of requests in the window
  maxRequests: number;
  
  // Time window in seconds
  windowSizeInSeconds: number;
  
  // Identifier function to determine which property to track (e.g., IP, username)
  identifierFn?: (req: NextRequest) => string;
}

interface RateLimitRecord {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blocked: boolean;
  blockUntil?: number;
}

// In-memory store for rate limiting
// This will reset on server restart - for production, use Redis or another persistent store
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Clean up old records from the rate limit store
 * Should be called periodically to prevent memory leaks
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  // Keep records for at most 24 hours
  const maxAge = 24 * 60 * 60 * 1000;
  
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.lastRequest > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up store every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}

/**
 * Rate limiting middleware for API routes
 * 
 * @param options Rate limiting options
 * @returns Middleware function for rate limiting
 */
export function rateLimiter(options: RateLimitOptions) {
  const logger = getLogger();
  
  // Default identifier function uses IP address
  const getIdentifier = options.identifierFn || 
    ((req: NextRequest) => req.ip || req.headers.get('x-forwarded-for') || 'unknown');
  
  return async function(req: NextRequest): Promise<NextResponse | null> {
    try {
      const identifier = getIdentifier(req);
      const now = Date.now();
      
      // Get record from store or create new one
      let record = rateLimitStore.get(identifier);
      
      if (!record) {
        record = {
          count: 0,
          firstRequest: now,
          lastRequest: now,
          blocked: false
        };
        rateLimitStore.set(identifier, record);
      }
      
      // Check if client is blocked
      if (record.blocked && record.blockUntil && now < record.blockUntil) {
        const retryAfter = Math.ceil((record.blockUntil - now) / 1000);
        
        logger.warn('Rate limit exceeded - client blocked', {
          identifier,
          path: req.nextUrl.pathname,
          retryAfter
        });
        
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter)
            }
          }
        );
      }
      
      // If previously blocked but block period expired, reset the record
      if (record.blocked && record.blockUntil && now >= record.blockUntil) {
        record = {
          count: 0,
          firstRequest: now,
          lastRequest: now,
          blocked: false
        };
      }
      
      // Check if window has expired and reset if needed
      const windowSize = options.windowSizeInSeconds * 1000;
      if (now - record.firstRequest > windowSize) {
        record.count = 0;
        record.firstRequest = now;
      }
      
      // Increment count and update last request
      record.count += 1;
      record.lastRequest = now;
      
      // Check if rate limit is exceeded
      if (record.count > options.maxRequests) {
        // Implement exponential backoff based on how many times the limit was exceeded
        const exceededBy = record.count - options.maxRequests;
        const blockDuration = Math.min(
          // Start with 30 seconds, double for each excess request, max 1 hour
          30 * Math.pow(2, exceededBy - 1) * 1000,
          60 * 60 * 1000 // 1 hour max
        );
        
        record.blocked = true;
        record.blockUntil = now + blockDuration;
        
        const retryAfter = Math.ceil(blockDuration / 1000);
        
        logger.warn('Rate limit exceeded - blocking client', {
          identifier,
          path: req.nextUrl.pathname,
          retryAfter,
          exceededBy
        });
        
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter)
            }
          }
        );
      }
      
      // Update the record in the store
      rateLimitStore.set(identifier, record);
      
      // Allow request to proceed
      return null;
    } catch (error) {
      logger.error('Error in rate limiter middleware', { error });
      // Don't block requests if rate limiter fails
      return null;
    }
  };
}

/**
 * Rate limiting middleware specifically for authentication endpoints
 * Uses stricter limits to prevent brute force attacks
 * 
 * @param req The next request object
 * @returns NextResponse or null if request should proceed
 */
export const authRateLimiter = rateLimiter({
  maxRequests: 5,                // 5 requests in 1 minute
  windowSizeInSeconds: 60,
  identifierFn: (req: NextRequest) => {
    // Include path in identifier to separate login/register/etc.
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
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
  limiter = authRateLimiter
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
