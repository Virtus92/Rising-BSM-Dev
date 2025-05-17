/**
 * Token utilities for authentication operations
 * Uses AuthService as the single source of truth
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/features/auth/core/AuthService';
import { getLogger } from '@/core/logging';
import { authErrorHandler, AuthErrorType } from './AuthErrorHandler';

const logger = getLogger();

/**
 * Handle expired token scenario consistently 
 * Checks for token refresh possibility
 */
export async function handleExpiredToken(
  request: NextRequest,
  endpoint: string
): Promise<NextResponse | null> {
  try {
    // First attempt a token refresh
    const refreshResult = await AuthService.refreshToken();
    
    if (refreshResult.success) {
      logger.info('Token refreshed successfully during expired token handling', {
        endpoint,
        refreshed: true
      });
      
      // Return null to indicate operation can proceed with refreshed token
      return null;
    }
    
    // If refresh failed, create a standard expired token response
    logger.warn('Token refresh failed during expired token handling', {
      endpoint,
      error: refreshResult.message
    });
    
    const expiredError = authErrorHandler.createError(
      'Authentication token has expired',
      AuthErrorType.TOKEN_EXPIRED,
      { 
        endpoint,
        refreshAttempted: true,
        refreshError: refreshResult.message
      },
      401
    );
    
    return expiredError.toResponse();
  } catch (error) {
    logger.error('Error handling expired token:', {
      error: error instanceof Error ? error.message : String(error),
      endpoint
    });
    
    const unexpectedError = authErrorHandler.createError(
      'Unexpected error handling authentication token',
      AuthErrorType.AUTH_ERROR,
      { endpoint },
      500
    );
    
    return unexpectedError.toResponse();
  }
}

/**
 * Get user ID from authentication context
 * Uses AuthService as source of truth
 */
export async function getUserId(request: NextRequest): Promise<number | null> {
  // First check request auth property (added by middleware)
  if ((request as any).auth?.id) {
    return (request as any).auth.id;
  }
  
  // If not available, try to get from AuthService
  try {
    const user = await AuthService.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting user ID:', error as Error);
    return null;
  }
}

/**
 * Check if the current user has a specific role
 * Uses AuthService as source of truth
 */
export async function hasRole(
  userId: number,
  role: string
): Promise<boolean> {
  try {
    return await AuthService.hasRole(userId, role);
  } catch (error) {
    logger.error('Error checking user role:', error as Error);
    return false;
  }
}

/**
 * Check if a token is valid and not expired
 * Uses AuthService as source of truth
 */
export async function isTokenValid(token?: string): Promise<boolean> {
  try {
    if (!token) {
      return await AuthService.validateToken();
    }
    
    const verification = await AuthService.verifyToken(token);
    return verification.valid === true;
  } catch (error) {
    logger.error('Error validating token:', error as Error);
    return false;
  }
}
