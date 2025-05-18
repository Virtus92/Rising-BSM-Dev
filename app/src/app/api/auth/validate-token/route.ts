import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { decodeAndValidateToken } from '@/features/auth/api/middleware/authMiddleware';

// Import token blacklist directly to avoid circular dependencies
import tokenBlacklist from '@/features/auth/utils/tokenBlacklist';

/**
 * Handle token validation with proper error handling
 */
async function handleValidation(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    let token = '';
    
    // Extract token from header or body
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      
      logger.debug('Validating token from Authorization header', {
        requestId: crypto.randomUUID().substring(0, 8),
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10)
      });
    } else {
      // Try to get from request body
      try {
        const body = await req.json();
        token = body.token || '';
        
        logger.debug('Validating token from request body', {
          requestId: crypto.randomUUID().substring(0, 8),
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 10)
        });
      } catch (parseError) {
        return NextResponse.json(
          formatResponse.error('Invalid request format - token not found', 400),
          { status: 400 }
        );
      }
    }
    
    if (!token) {
      return NextResponse.json(
        formatResponse.error('No token provided', 400),
        { status: 400 }
      );
    }

    // Validate token with full server-side validation
    const validationResult = await decodeAndValidateToken(token);
    
    if (validationResult.valid && validationResult.userId) {
      // For successful validations, check the token blacklist as an additional security measure
      // Use a try-catch block to make this more robust
      try {
        const isBlacklisted = await tokenBlacklist.isTokenBlacklisted(token);
        
        if (isBlacklisted) {
          logger.warn('Token is blacklisted or revoked', { userId: validationResult.userId });
          return NextResponse.json(
            formatResponse.error('Token has been revoked', 401, 'REVOKED_TOKEN'),
            { status: 401 }
          );
        }
        
        // Only refresh the blacklist periodically - not on every request
        // This prevents database overload
        await tokenBlacklist.refreshBlacklistCache();
      } catch (blacklistError) {
        // Log but continue - don't fail token validation due to blacklist errors
        logger.warn('Error checking token blacklist - continuing validation', { 
          error: blacklistError instanceof Error ? blacklistError.message : String(blacklistError),
          userId: validationResult.userId 
        });
      }
      
      logger.debug('Server token validation successful', {
        userId: validationResult.userId
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
      const error = 'Unknown validation error';
      logger.warn('Token validation failed', {
        token: token.substring(0, 10) + '...',
        error
      });
      
      return NextResponse.json(
        formatResponse.error(error, 401, 'INVALID_TOKEN'),
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Error validating token', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error('Error validating token', 500),
      { status: 500 }
    );
  }
}

// Export the standard HTTP methods that Next.js expects
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  return await handleValidation(req);
};

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  return await handleValidation(req);
};
