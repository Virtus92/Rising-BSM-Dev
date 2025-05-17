/**
 * Token utilities
 * Collection of helper methods to work with JWT tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';

const logger = getLogger();

/**
 * Check if a token is expired
 * @param token JWT token
 * @returns Object with expiration info
 */
export function isTokenExpired(token: string | null | undefined): {
  expired: boolean;
  exp?: number;
  now?: number;
  error?: string;
} {
  if (!token) {
    return { expired: false, error: 'No token provided' };
  }

  try {
    // Parse the token
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { expired: false, error: 'Invalid JWT format' };
    }

    // Decode the payload
    const payloadBase64 = tokenParts[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    
    if (!payload.exp) {
      return { expired: false, error: 'No expiration claim in token' };
    }
    
    return {
      expired: payload.exp < now,
      exp: payload.exp,
      now
    };
  } catch (e) {
    logger.error('Error checking token expiration:', e as Error);
    return { 
      expired: false, 
      error: e instanceof Error ? e.message : 'Unknown error parsing token' 
    };
  }
}

/**
 * Handle expired token in API routes
 * @param req Next.js request
 * @param path API path for logging
 * @returns NextResponse if token is expired, null otherwise
 */
export function handleExpiredToken(req: NextRequest, path: string): NextResponse | null {
  // Check for token expiration
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') || 
               req.headers.get('X-Auth-Token');
  
  if (!token) {
    return null;
  }
  
  // Check if token is expired
  const { expired, exp, now, error } = isTokenExpired(token);
  
  if (error) {
    logger.debug(`Token check error for ${path}: ${error}`);
    return null;
  }
  
  if (expired) {
    // Log token expiration details
    logger.debug(`[AUTH] Token expired for ${path}, sending special response`);
    logger.debug(`Token expired { exp: ${exp}, now: ${now} }`);
    logger.debug(`Token expired for ${path}, signaling for refresh`);
    
    // Return a special response that signals token refresh is needed
    return formatResponse.error(
      'Token expired',
      401,
      'TOKEN_EXPIRED',
      {
        headers: {
          'X-Auth-Status': 'token-expired',
          'X-Auth-Refresh-Required': 'true'
        }
      }
    );
  }
  
  return null;
}

/**
 * Extract user information from a JWT token
 * @param token JWT token
 * @returns User information or null if invalid token
 */
export function extractUserFromToken(token: string | null | undefined): {
  userId?: number;
  email?: string;
  role?: string;
  name?: string;
  sub?: string;
} | null {
  if (!token) {
    return null;
  }
  
  try {
    // Parse the token
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }
    
    // Decode the payload
    const payloadBase64 = tokenParts[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    
    // Extract user info
    return {
      userId: payload.userId || (payload.sub ? Number(payload.sub) : undefined),
      email: payload.email,
      role: payload.role,
      name: payload.name,
      sub: payload.sub
    };
  } catch (e) {
    logger.error('Error extracting user from token:', e as Error);
    return null;
  }
}
