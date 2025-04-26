import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '@/core/db/prisma/client';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

// Get the current user profile using the auth cookie
export async function GET(req: NextRequest) {
  const logger = getLogger();
  const prisma = getPrismaClient();
  
  try {
    // Get auth token from cookie or header - CONSISTENT NAMING
    let token = req.cookies.get('auth_token')?.value;
    
    // If no token in cookie, check authorization header (supports both formats)
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        } else {
          token = authHeader; // Allow raw token for flexibility
        }
      }
    }
    
    if (!token) {
      logger.info('Unauthorized access attempt to /api/users/me - No token provided');
      return NextResponse.json(
        formatResponse.error('Unauthorized - Missing authentication token', 401),
        { status: 401 }
      );
    }
    
    // Log token debugging info (first 10 chars only - for security)
    if (token) {
      logger.debug('Processing auth token for /users/me', {
        tokenPrefix: token.substring(0, 10) + '...',
        tokenLength: token.length
      });
    }
    
    try {
      // Verify token with detailed error handling
      const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
      
      // Log more detailed token verification attempt (safely)
      logger.debug('Attempting to verify token', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
        secretPrefix: jwtSecret.substring(0, 3) + '...' // Only log prefix for security
      });
      
      let decoded;
      
      try {
        // First try to verify with standard JWT claims (issuer and audience)
        decoded = jwt.verify(token, jwtSecret, {
          issuer: 'rising-bsm',
          audience: process.env.JWT_AUDIENCE || 'rising-bsm-app'
        }) as any;
        
        logger.debug('Token validation passed with standard JWT claims');
      } catch (claimError) {
        // If claim validation fails, try legacy verification without issuer/audience
        logger.debug('Standard claim validation failed, trying legacy verification:', { 
          error: claimError instanceof Error ? claimError.message : String(claimError) 
        });
        
        decoded = jwt.verify(token, jwtSecret) as any;
        logger.debug('Legacy token validation passed (no issuer/audience)');
      }
      
      if (!decoded || !decoded.sub) {
        logger.warn('Invalid token format in /api/users/me');
        return NextResponse.json(
          formatResponse.error('Invalid token format', 401),
          { status: 401 }
        );
      }
      
      // Log successful token verification
      logger.debug('Token verification successful', {
        sub: decoded.sub,
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'none'
      });
      
      // Get user from database
      const userId = parseInt(decoded.sub, 10);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          phone: true
        }
      });
      
      if (!user) {
        logger.warn(`User not found in database for ID: ${userId}`);
        return NextResponse.json(
          formatResponse.error('User not found', 404),
          { status: 404 }
        );
      }
      
      // Return user data in a consistent format
      return NextResponse.json(
        {
          success: true,
          message: 'User profile retrieved successfully',
          data: user,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    } catch (tokenError) {
      logger.error('Token validation error:', { tokenError });
      return NextResponse.json(
        formatResponse.error('Invalid or expired token', 401),
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Error in /api/users/me route:',  { error });
    return NextResponse.json(
      formatResponse.error('An error occurred while fetching user profile', 500),
      { status: 500 }
    );
  }
}
