/**
 * Logout API Route Handler
 * Handles secure logout by revoking tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { blacklistToken, blacklistUser } from '@/features/auth/lib/clients/token/blacklist/TokenBlacklistServer';

export async function logoutHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get the auth service
    const authService = serviceFactory.createAuthService();
    
    // Get tokens from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    // Create response that will clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    // Always clear cookies regardless of token validity
    response.cookies.delete('auth_token');
    response.cookies.delete('refresh_token');
    
    // If no tokens, just return success (already logged out)
    if (!authToken && !refreshToken) {
      logger.info('Logout: No tokens found');
      return response;
    }
    
    // Extract user ID from token if possible
    let userId: number | undefined;
    
    // If we have an auth token, decode it to get info (without verification)
    if (authToken) {
      try {
        // Add auth token to blacklist until it expires
        const decodedToken = jwt.decode(authToken) as any;
        
        if (decodedToken && decodedToken.exp) {
          // Convert exp (in seconds) to milliseconds
          const expiryMs = decodedToken.exp * 1000;
          
          // Extract user ID if available
          if (decodedToken.sub) {
            userId = parseInt(decodedToken.sub, 10);
          }
          
          // Add to blacklist using our improved implementation
          blacklistToken(authToken);
          
          // If we have a user ID, also blacklist all tokens for this user
          if (userId) {
            blacklistUser(userId);
            logger.info('User tokens blacklisted for logout', { userId });
          }
          
          logger.info('Auth token added to blacklist', { userId: decodedToken.sub });
        }
      } catch (error) {
        logger.warn('Failed to decode auth token during logout', { error });
      }
    }
    
    // If we have a user ID and refresh token, use the auth service to log out
    if (userId && refreshToken) {
      try {
        await authService.logout(
          userId, 
          { refreshToken, allDevices: true },
          { context: { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' } }
        );
        
        logger.info('User logged out via auth service', { userId });
      } catch (error) {
        logger.warn('Failed to logout via auth service', { error, userId });
      }
    }
    // If we have only a refresh token but no user ID
    else if (refreshToken) {
      try {
        // Use token blacklist as fallback
        blacklistToken(refreshToken);
        logger.info('Refresh token added to blacklist');
      } catch (error) {
        logger.warn('Failed to blacklist refresh token during logout', { error });
      }
    }
    
    // Log successful logout
    logger.info('User logged out successfully');
    
    return response;
  } catch (error) {
    logger.error('Logout error:', { error });
    
    // Even if there's an error, clear the cookies
    const response = NextResponse.json({
      success: false,
      message: 'Error during logout, but cookies have been cleared'
    });
    
    response.cookies.delete('auth_token');
    response.cookies.delete('refresh_token');
    
    return response;
  }
}
