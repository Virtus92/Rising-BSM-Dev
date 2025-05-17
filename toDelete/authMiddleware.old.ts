/**
 * Clean Authentication Middleware
 * 
 * Design principles:
 * 1. Consistent validation logic
 * 2. No caching that creates stale state
 * 3. Clear error handling
 * 4. Single source of truth for tokens
 * 
 * ⚠️ WARNING ⚠️
 * This file should not be imported by Edge Runtime code (middleware.ts).
 * It uses Node.js crypto which is not supported in Edge Runtime.
 * Use authMiddlewareEdge.ts for Edge Runtime instead.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import jwt from 'jsonwebtoken';

const logger = getLogger();

/**
 * JWT validation options
 */
const JWT_OPTIONS = {
  issuer: 'rising-bsm',
  audience: process.env.JWT_AUDIENCE || 'rising-bsm-app',
  maxAge: '1h', // Maximum token age
};

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  };
  error?: string;
  statusCode?: number;
}

/**
 * Extract token from request
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check X-Auth-Token header
  const customHeader = request.headers.get('X-Auth-Token');
  if (customHeader) {
    return customHeader;
  }
  
  // Check cookies
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

/**
 * Validate JWT token
 */
async function validateToken(token: string): Promise<jwt.JwtPayload> {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, jwtSecret, JWT_OPTIONS);
    
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    
    throw error;
  }
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    // Dynamic import to avoid circular dependencies
    const { isBlacklisted } = await import('../lib/clients/token/blacklist/TokenBlacklistServer');
    return await isBlacklisted(token);
  } catch (error) {
    logger.error('Error checking token blacklist:', error as Error);
    // Fail open - don't block on blacklist errors
    return false;
  }
}

/**
 * Authenticate request
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract token
    const token = extractToken(request);
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        statusCode: 401,
      };
    }
    
    // Check blacklist
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return {
        success: false,
        error: 'Token has been revoked',
        statusCode: 401,
      };
    }
    
    // Validate token
    const decoded = await validateToken(token);
    
    // Extract user information
    const user = {
      id: Number(decoded.sub),
      email: decoded.email as string,
      name: decoded.name as string | undefined,
      role: decoded.role as string | undefined,
    };
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    logger.error('Authentication error:', error as Error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      statusCode: 401,
    };
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(
  request: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: authResult.error,
      },
      {
        status: authResult.statusCode || 401,
      }
    );
  }
  
  // Add user to request headers for downstream use
  const response = await next();
  
  if (authResult.user) {
    response.headers.set('X-User-Id', authResult.user.id.toString());
    response.headers.set('X-User-Email', authResult.user.email);
    if (authResult.user.name) {
      response.headers.set('X-User-Name', authResult.user.name);
    }
    if (authResult.user.role) {
      response.headers.set('X-User-Role', authResult.user.role);
    }
  }
  
  return response;
}

/**
 * Create auth middleware for API routes
 */
export function withAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    return authMiddleware(request, () => handler(request, context));
  };
}

/**
 * Get user from request
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthResult['user'] | null> {
  const authResult = await authenticateRequest(request);
  return authResult.success ? authResult.user : null;
}
