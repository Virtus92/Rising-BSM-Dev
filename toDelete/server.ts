/**
 * Server-side token utilities
 * 
 * This file contains server-only utilities for token management.
 * It's designed to be used in RSC (React Server Components) or API Routes.
 */
import { ServerTokenManager } from './TokenManager.server';
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { getLogger } from '@/core/logging';
import jwt from 'jsonwebtoken';
import { TokenUser } from './interfaces/ITokenManager';

// For server use only, never import this in client components
const logger = getLogger();

// Extended JwtPayload interface to include our custom properties
interface ExtendedJwtPayload extends JwtPayload {
  name?: string;
  email?: string;
  role?: string;
}

/**
 * Get token from request cookies
 * This is a server-only function
 */
export async function getTokenFromRequest(req: NextRequest): Promise<string | null> {
  try {
    // Try all possible cookie names for compatibility
    const authToken = req.cookies.get('auth_token')?.value || 
                    req.cookies.get('auth_token_access')?.value ||
                    req.cookies.get('access_token')?.value;
    
    return authToken || null;
  } catch (error) {
    logger.error('Error getting token from request cookies:', error as Error);
    return null;
  }
}

/**
 * Validate token
 * This is a server-only function
 */
import { isBlacklisted } from './blacklist/TokenBlacklistServer';

export async function validateToken(token: string, jwtSecret: string): Promise<boolean> {
  try {
    if (!token) {
      logger.debug('No token provided to validateToken');
      return false;
    }
    
    // Check if token is blacklisted before verification
    const blacklistCheck = await isBlacklisted(token);
    if (blacklistCheck) {
      logger.debug('Token is blacklisted');
      return false;
    }
    
    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as ExtendedJwtPayload;
    
    // Check required claims
    if (!decoded.sub || !decoded.exp) {
      logger.debug('Token missing required claims (sub or exp)');
      return false;
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      logger.debug(`Token expired at ${new Date(decoded.exp * 1000).toISOString()}`);
      return false;
    }
    
    logger.debug('Token validation successful');
    return true;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Token expired', error);
      return false;
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug('Invalid token format', error);
      return false;
    } else {
      logger.error('Error validating token:', error as Error);
      return false;
    }
  }
}

/**
 * Get user from token
 * This is a server-only function
 */
export function getUserFromToken(token: string, jwtSecret: string): TokenUser | null {
  try {
    // Verify token with JWT library for proper validation
    const decoded = jwt.verify(token, jwtSecret) as ExtendedJwtPayload;
    
    if (!decoded || !decoded.sub) {
      logger.debug('Token missing subject (sub) claim');
      return null;
    }
    
    // UserId can be in sub as string or number
    let userId: number;
    if (typeof decoded.sub === 'number') {
      userId = decoded.sub;
    } else if (typeof decoded.sub === 'string') {
      userId = parseInt(decoded.sub, 10);
    } else {
      logger.debug(`Invalid sub format in token: ${JSON.stringify(decoded.sub)}`);
      return null;
    }
    
    // Check for required fields
    if (isNaN(userId)) {
      logger.debug(`Invalid user ID in token: ${decoded.sub}`);
      return null;
    }
    
    // Log successful extraction
    logger.debug(`Successfully extracted user from token: ID=${userId}, role=${decoded.role || 'none'}`);
    
    return {
      id: userId,
      name: decoded.name || '',
      email: decoded.email || '',
      role: decoded.role || ''
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Token expired while getting user data');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug('Invalid token format while getting user data');
    } else {
      logger.error('Error getting user from token:', error as Error);
    }
    return null;
  }
}

/**
 * Clear token cookies
 * This is a server-only function
 */
export function clearTokenCookies(res: NextResponse): NextResponse {
  // Clear all possible token cookies
  const cookiesToClear = [
    'auth_token',
    'auth_token_access',
    'access_token',
    'refresh_token',
    'refresh_token_access'
  ];
  
  for (const cookieName of cookiesToClear) {
    res.cookies.delete(cookieName);
  }
  
  return res;
}

// Export the ServerTokenManager for use in other files
export { ServerTokenManager };

/**
 * Set token in response cookies
 * This is a server-only function
 */
export function setTokenCookie(
  res: NextResponse, 
  token: string, 
  cookieName: string = 'auth_token', 
  maxAge: number = 3600,
  options: {
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
    priority?: 'low' | 'medium' | 'high';
  } = {}
): NextResponse {
  // Fix: Use the correct method signature for cookies.set()
  res.cookies.set(cookieName, token, {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: options.sameSite || 'strict',
    path: options.path || '/',
    // You can set priority using the Cookies-* header manually if needed
  });
  
  // Set additional security headers
  if (options.sameSite) {
    res.headers.set('Set-Cookie-SameSite', options.sameSite);
  }
  
  if (options.priority) {
    res.headers.set('Set-Cookie-Priority', options.priority);
  }
  
  return res;
}