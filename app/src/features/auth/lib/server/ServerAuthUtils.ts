/**
 * Server-side Authentication Utilities
 * Server-safe token verification without client dependencies
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { cookies } from 'next/headers';
import { getLogger } from '@/core/logging';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || '';

// Cookie names - must match client-side TokenManager config
const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const logger = getLogger();

// Auth token payload interface
interface AuthTokenPayload {
  userId: number;
  sub: string | number;
  email: string;
  role?: string;
  exp?: number;
  iat?: number;
  name?: string;
  permissions?: string[];
}

// Token verification result interface
export interface TokenVerificationResult {
  valid: boolean;
  expired?: boolean;
  userId?: number;
  email?: string;
  role?: string;
  reason?: string;
  name?: string;
  exp?: number;
  permissions?: string[];
}

/**
 * Get token from request cookies
 * @param req Next.js request object
 * @returns Token or null if not found
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  try {
    // Get token from cookies
    const token = req.cookies.get(ACCESS_TOKEN_KEY)?.value;
    return token || null;
  } catch (error) {
    logger.error('Error getting token from request:', error as Error);
    return null;
  }
}

/**
 * Verify the auth token on the server side
 * @param token JWT token to verify
 * @returns Token verification result
 */
export function verifyAuthToken(token: string): TokenVerificationResult {
  try {
    if (!token) {
      return { valid: false, reason: 'No token provided' };
    }
    
    if (!JWT_SECRET) {
      logger.error('JWT_SECRET not set in environment variables');
      return { valid: false, reason: 'Server configuration error' };
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    
    // Return user information
    return {
      valid: true,
      userId: typeof decoded.sub === 'string' ? parseInt(decoded.sub, 10) : decoded.sub as number,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      exp: decoded.exp,
      permissions: decoded.permissions
    };
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        expired: true,
        reason: 'Token expired'
      };
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        reason: `Invalid token: ${error.message}`
      };
    }
    
    // Handle generic errors
    logger.error('Error verifying auth token:', error as Error);
    return {
      valid: false,
      reason: 'Token verification failed'
    };
  }
}

/**
 * Get and verify the auth token from cookies
 * For use in server components and API routes
 * @returns Token verification result
 */
export async function getVerifiedAuthToken(): Promise<TokenVerificationResult> {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_KEY)?.value;
    
    if (!token) {
      return { valid: false, reason: 'No token in cookies' };
    }
    
    // Verify the token
    return verifyAuthToken(token);
  } catch (error) {
    logger.error('Error getting and verifying auth token:', error as Error);
    return { valid: false, reason: 'Error accessing or verifying token' };
  }
}

/**
 * Get user ID from verified token
 * Convenience method for server components
 * @returns User ID or null if not authenticated
 */
export async function getUserIdFromToken(): Promise<number | null> {
  const verification = await getVerifiedAuthToken();
  return verification.valid && verification.userId ? verification.userId : null;
}

/**
 * Clear auth cookies from response
 * @param res NextResponse object to clear cookies from
 */
export function clearAuthCookies(res: NextResponse): NextResponse {
  // Remove all auth cookies
  res.cookies.delete(ACCESS_TOKEN_KEY);
  res.cookies.delete(REFRESH_TOKEN_KEY);
  
  // Also clear any legacy cookies
  res.cookies.delete('auth_token_backup');
  res.cookies.delete('refresh_token_backup');
  res.cookies.delete('auth_expiry');
  res.cookies.delete('auth_expires_at');
  
  return res;
}

export default {
  getTokenFromRequest,
  verifyAuthToken,
  getVerifiedAuthToken,
  getUserIdFromToken,
  clearAuthCookies
};
