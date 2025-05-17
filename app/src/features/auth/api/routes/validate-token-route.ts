/**
 * Token Validation API Route Handler
 * 
 * Validates authentication tokens (not reset tokens).
 * This is for checking the validity of auth tokens, not password reset tokens.
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { decodeAndValidateToken } from '@/features/auth/api/middleware/authMiddleware';
import tokenBlacklist from '@/features/auth/utils/tokenBlacklist';

/**
 * Handles authentication token validation requests
 */
export async function validateTokenHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const requestId = crypto.randomUUID().substring(0, 8);
  
  // Parse the request body or check authorization header
  let token = '';
  
  // Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    
    logger.debug('Validating token from Authorization header', {
      requestId,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 8)
    });
  } else {
    // Try request body
    try {
      const body = await req.json();
      token = body.token || '';
    } catch (parseError) {
      return NextResponse.json(
        formatResponse.error('Invalid request format or missing token', 400),
        { status: 400 }
      );
    }
  }
  
  if (!token) {
    return NextResponse.json(
      formatResponse.error('Token is required', 400),
      { status: 400 }
    );
  }
  
  try {
    // Validate the token using the middleware function
    const validationResult = await decodeAndValidateToken(token);
    
    // Also check the blacklist
    if (validationResult.valid && validationResult.userId) {
      try {
        const isBlacklisted = await tokenBlacklist.isTokenBlacklisted(token);
        if (isBlacklisted) {
          logger.warn('Token is valid but blacklisted', { 
            userId: validationResult.userId,
            requestId 
          });
          
          return NextResponse.json(
            formatResponse.error('Token has been revoked', 401, 'REVOKED_TOKEN'),
            { status: 401 }
          );
        }
      } catch (blacklistError) {
        // Log but don't fail validation due to blacklist errors
        logger.warn('Error checking token blacklist', {
          error: blacklistError instanceof Error ? blacklistError.message : String(blacklistError),
          requestId
        });
      }
      
      logger.debug('Token validation successful', {
        userId: validationResult.userId,
        requestId
      });
      
      return NextResponse.json(
        formatResponse.success({
          valid: true,
          userId: validationResult.userId,
          role: validationResult.role
        }),
        { status: 200 }
      );
    } else {
      logger.warn('Token validation failed', {
        requestId,
      });
      
      return NextResponse.json(
        formatResponse.error(
          'INVALID_TOKEN'
        ),
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Error validating token', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId
    });
    
    return NextResponse.json(
      formatResponse.error(
        'Error validating token',
        500
      ),
      { status: 500 }
    );
  }
}