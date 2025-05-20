import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware
 * 
 * This middleware runs on all API routes to provide consistent security headers
 * and other global configuration.
 */
export function middleware(request: NextRequest) {
  // Create the response
  const response = NextResponse.next();
  
  // Add security headers to all API responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

// Define which routes this middleware applies to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
  ],
};
