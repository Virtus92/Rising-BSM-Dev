import { NextRequest, NextResponse } from 'next/server';

/**
 * Minimal middleware for Rising-BSM
 * Only adds essential security headers without blocking
 */
export async function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();
  
  // Add basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

// Only apply to API routes to avoid interfering with Next.js
export const config = {
  matcher: '/api/:path*'
};
