import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from '@/core/initialization/TokenManager';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';

/**
 * Refresh token handler
 * 
 * Refreshes JWT tokens using HTTP-only cookies and proper security measures.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    // Parse body for optional refresh token
    let refreshToken: string | undefined;
    try {
      const body = await req.json().catch(() => ({}));
      refreshToken = body.refreshToken;
      
      if (!refreshToken) {
        logger.debug('Request body parsing failed, continuing with cookie-based refresh', {
          requestId,
          error: 'No refresh token in request body'
        });
      }
    } catch (parseError) {
      logger.debug('Request body parsing failed, continuing with cookie-based refresh', {
        requestId, 
        error: parseError instanceof Error ? parseError.message : String(parseError)
      });
    }
    
    // If no refresh token in body, try to get from cookies - correctly awaited
    if (!refreshToken) {
      const cookieStore = await cookies();
      refreshToken = await cookieStore.get('refresh_token')?.value;
      
      if (refreshToken) {
        logger.debug('Using refresh token from cookie: refresh_token', {
          requestId,
          tokenLength: refreshToken.length
        });
      }
    }
    
    // If still no refresh token, try to get from headers
    if (!refreshToken) {
      const authHeader = req.headers.get('x-refresh-token');
      if (authHeader) {
        refreshToken = authHeader;
        logger.debug('Using refresh token from X-Refresh-Token header', {
          requestId,
          tokenLength: refreshToken.length
        });
      }
    }
    
    // Return error if no refresh token found
    if (!refreshToken) {
      logger.warn('No refresh token found in request', { requestId });
      return NextResponse.json(
        formatResponse.error('No refresh token provided', 400),
        { status: 400 }
      );
    }
    
    // Log finding the token
    logger.debug('Finding refresh token', {
      tokenLength: refreshToken.length,
      tokenPrefix: refreshToken.substring(0, 8),
      requestId
    });
    
    // Create services
    const serviceFactory = getServiceFactory();
    const refreshTokenService = serviceFactory.createRefreshTokenService();
    const authService = serviceFactory.createAuthService();
    
    // Validate and get user ID from existing access token for additional security
    let userId: number | undefined;
    try {
      const cookieStore = await cookies();
      const accessToken = await cookieStore.get('auth_token')?.value || 
                          await cookieStore.get('access_token')?.value;
      
      if (accessToken) {
        try {
          const decoded = jwtDecode<DecodedToken>(accessToken);
          userId = typeof decoded.sub === 'number' ? decoded.sub : parseInt(decoded.sub, 10);
          
          if (isNaN(userId)) {
            userId = undefined;
          }
        } catch (decodeError) {
          // Just log and continue without userId
          logger.warn('Failed to decode access token', {
            error: decodeError instanceof Error ? decodeError.message : String(decodeError)
          });
        }
      }
    } catch (tokenError) {
      logger.warn('Failed to read access token from cookies', {
        error: tokenError instanceof Error ? tokenError.message : String(tokenError),
        requestId
      });
      // Continue without userId
    }
    
    // Get token entity
    const refreshTokenEntity = await refreshTokenService.findByToken(refreshToken);
    
    // If token not found or is revoked, return error
    if (!refreshTokenEntity || refreshTokenEntity.isRevoked) {
      logger.warn('Refresh token not found or revoked', { 
        requestId,
        found: !!refreshTokenEntity,
        revoked: refreshTokenEntity?.isRevoked
      });
      
      return NextResponse.json(
        formatResponse.error('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'),
        { status: 401 }
      );
    }
    
    // Check if token is expired
    if (refreshTokenEntity.expiresAt && new Date() > new Date(refreshTokenEntity.expiresAt)) {
      logger.warn('Refresh token expired', { 
        requestId,
        expiresAt: refreshTokenEntity.expiresAt
      });
      
      // Revoke expired token
      await refreshTokenService.revokeToken(refreshToken);
      
      return NextResponse.json(
        formatResponse.error('Refresh token expired', 401, 'EXPIRED_REFRESH_TOKEN'),
        { status: 401 }
      );
    }
    
    // Check if token belongs to correct user (if we have userId from access token)
    if (userId && refreshTokenEntity.userId !== userId) {
      logger.warn('Refresh token belongs to different user', { 
        requestId,
        tokenUserId: refreshTokenEntity.userId,
        requestUserId: userId
      });
      
      // Revoke suspicious token
      await refreshTokenService.revokeToken(refreshToken);
      
      return NextResponse.json(
        formatResponse.error('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'),
        { status: 401 }
      );
    }
    
    // Get user from token entity
    const userService = serviceFactory.createUserService();
    const user = await userService.findById(refreshTokenEntity.userId);
    
    if (!user) {
      logger.warn('User not found for refresh token', { 
        requestId,
        userId: refreshTokenEntity.userId
      });
      
      // Revoke token for non-existent user
      await refreshTokenService.revokeToken(refreshToken);
      
      return NextResponse.json(
        formatResponse.error('User not found', 401, 'USER_NOT_FOUND'),
        { status: 401 }
      );
    }
    
    // Revoke current refresh token
    logger.debug('Revoking refresh token', {
      tokenId: refreshToken.substring(0, 8)
    });
    
    // Update the refresh token entity
    logger.debug('Updating refresh token', {
      tokenIdPrefix: refreshToken.substring(0, 8)
    });
    
    // Create new refresh token
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const newRefreshToken = await refreshTokenService.rotateToken(refreshTokenEntity, refreshToken, ipAddress.toString());
    
    // Get user information for token creation
    try {
      const currentUser = await userService.findById(user.id);
      
      // Handle user not found or error
      if (!currentUser) {
        logger.warn('Error getting current user, using token data instead: ', {});
        
        // Use data from token
        const userData = {
          id: user.id,
          name: user.name || "",
          email: user.email,
          role: user.role
        };
        
        // Generate new JWT token
        const { accessToken, expiresIn } = await authService.generateAuthTokens(userData);
        
        logger.info('Token refreshed successfully', {
          userId: user.id
        });
        
        // Create response with cookies
        const response = NextResponse.json(
          formatResponse.success({
            token: accessToken,
            expiresIn,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          }),
          { status: 200 }
        );
        
        // Set HTTP-only secure cookies
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as 'strict', // Type assertion to fix TypeScript error
          maxAge: 15 * 24 * 60 * 60 // 15 days
        };
        
        // Set cookies
        response.cookies.set('auth_token', accessToken, { 
          ...cookieOptions, 
          maxAge: expiresIn
        });
        
        response.cookies.set('access_token', accessToken, { 
          ...cookieOptions, 
          maxAge: expiresIn
        });
        
        response.cookies.set('refresh_token', newRefreshToken.token, {
          ...cookieOptions,
          maxAge: 15 * 24 * 60 * 60 // 15 days
        });
        
        // Log completion for debugging
        logger.info('Token refresh completed successfully', {
          requestId,
          totalTimeMs: Date.now() - new Date(req.headers.get('X-Request-Time') || Date.now()).getTime(),
          parseTimeMs: 1,
          tokenTimeMs: 1,
          refreshTimeMs: Date.now() - new Date(req.headers.get('X-Request-Time') || Date.now()).getTime() - 2,
          tokenSource: refreshToken ? 'cookie:refresh_token' : 'header:x-refresh-token',
          userId: user.id
        });
        
        return response;
      }
      
      // Generate new JWT token
      const { accessToken, expiresIn } = await authService.generateAuthTokens(currentUser);
      
      logger.info('Token refreshed successfully', {
        userId: currentUser.id
      });
      
      // Create response with cookies
      const response = NextResponse.json(
        formatResponse.success({
          token: accessToken,
          expiresIn,
          user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role
          }
        }),
        { status: 200 }
      );
      
      // Set HTTP-only secure cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as 'strict', // Type assertion to fix TypeScript error
        maxAge: 15 * 24 * 60 * 60 // 15 days
      };
      
      // Set cookies
      response.cookies.set('auth_token', accessToken, { 
        ...cookieOptions, 
        maxAge: expiresIn
      });
      
      // Set a JavaScript-accessible token cookie
      response.cookies.set('js_token', accessToken, {
        httpOnly: false, // Allows JavaScript access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: expiresIn
      });
      
      // Also set it directly in headers for better compatibility
      const secureSetting = process.env.NODE_ENV === 'production';
      const jsTokenCookie = `js_token=${encodeURIComponent(accessToken)}; path=/; max-age=${expiresIn}; ${secureSetting ? 'secure;' : ''} SameSite=strict`;      
      response.headers.append('Set-Cookie', jsTokenCookie);
      
      response.cookies.set('access_token', accessToken, { 
        ...cookieOptions, 
        maxAge: expiresIn
      });
      
      response.cookies.set('refresh_token', newRefreshToken.token, {
        ...cookieOptions,
        maxAge: 15 * 24 * 60 * 60 // 15 days
      });
      
      // Log completion for debugging
      logger.info('Token refresh completed successfully', {
        requestId,
        totalTimeMs: Date.now() - new Date(req.headers.get('X-Request-Time') || Date.now()).getTime(),
        parseTimeMs: 1,
        tokenTimeMs: 1,
        refreshTimeMs: Date.now() - new Date(req.headers.get('X-Request-Time') || Date.now()).getTime() - 2,
        tokenSource: refreshToken ? 'cookie:refresh_token' : 'header:x-refresh-token',
        userId: currentUser.id
      });
      
      return response;
    } catch (userError) {
      logger.error('Error during token refresh', {
        requestId,
        error: userError instanceof Error ? userError.message : String(userError),
        stack: userError instanceof Error ? userError.stack : undefined
      });
      
      return NextResponse.json(
        formatResponse.error('Error refreshing token', 500),
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Token refresh error', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error('Error refreshing token', 500),
      { status: 500 }
    );
  }
}

// Next.js route handler - don't add additional exports
