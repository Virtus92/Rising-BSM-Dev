/**
 * Logout API Route
 * Handles secure logout by revoking tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getLogger } from '@/infrastructure/common/logging';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { securityConfig } from '@/infrastructure/common/config/SecurityConfig';
import { tokenBlacklist } from '@/infrastructure/auth/TokenBlacklist';

export async function POST(req: NextRequest) {
  const logger = getLogger();
  const prisma = getPrismaClient();
  
  try {
    // Get tokens from cookies
    const cookieStore = cookies();
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
    
    // If we have an auth token, decode it to get info (without verification)
    if (authToken) {
      try {
        // Add auth token to blacklist until it expires
        const decodedToken = jwt.decode(authToken) as any;
        
        if (decodedToken && decodedToken.exp) {
          // Convert exp (in seconds) to milliseconds
          const expiryMs = decodedToken.exp * 1000;
          
          // Add to blacklist with token ID if available
          if (decodedToken.jti) {
            tokenBlacklist.add(decodedToken.jti, expiryMs, 'logout');
            logger.info('Auth token added to blacklist', { 
              tokenId: decodedToken.jti.substring(0, 8) + '...',
              userId: decodedToken.sub 
            });
          } else {
            // Fallback to using the token itself
            tokenBlacklist.add(authToken, expiryMs, 'logout');
            logger.info('Auth token added to blacklist', { userId: decodedToken.sub });
          }
        }
      } catch (error) {
        logger.warn('Failed to decode auth token during logout', { error });
      }
    }
    
    // If we have a refresh token, mark it as revoked in the database
    if (refreshToken) {
      try {
        const result = await prisma.refreshToken.updateMany({
          where: {
            token: refreshToken,
            isRevoked: false
          },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedByIp: req.headers.get('x-forwarded-for') || 'unknown'
          }
        });
        
        if (result.count > 0) {
          logger.info('Refresh token revoked during logout', { count: result.count });
        } else {
          logger.info('No valid refresh token found to revoke');
        }
      } catch (error) {
        logger.warn('Failed to revoke refresh token during logout', { error });
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
