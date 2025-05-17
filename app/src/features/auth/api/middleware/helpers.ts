/**
 * Auth middleware helpers
 */

import { NextRequest } from 'next/server';

/**
 * Extract auth token from request headers or cookies
 */
export function extractAuthToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}
