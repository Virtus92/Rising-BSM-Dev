/**
 * Clean Logout Handler
 * 
 * Design principles:
 * 1. Use new auth service
 * 2. Clear tokens properly
 * 3. Simple implementation
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/core/factories/serviceFactory.server';
const authService = getAuthService();
import { getLogger } from '@/core/logging';

const logger = getLogger();

export async function logoutHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user ID from cookies or request body
    const data = await request.json().catch(() => ({}));
    const userId = data.userId || 0; // Default to 0 if not provided
    
    // Perform logout
    await authService.logout(userId);
    
    logger.info('User logged out successfully');
    
    // Create a response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
    
    // Clear all authentication-related cookies
    const cookiesToClear = ['auth_token', 'access_token', 'refresh_token', 'api_auth_token'];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/'
      });
    });
    
    // Also clear API-specific cookies
    response.cookies.set({
      name: 'api_auth_token',
      value: '',
      expires: new Date(0),
      path: '/api/'
    });
    
    logger.debug('Cleared authentication cookies', {
      cookies: cookiesToClear,
      userId
    });
    
    return response;
  } catch (error) {
    logger.error('Logout error:', error as Error);
    
    // Even on error, clear cookies for the client
    const response = NextResponse.json({
      success: true,
      message: 'Logout completed',
    });
    
    // Clear all authentication-related cookies
    const cookiesToClear = ['auth_token', 'access_token', 'refresh_token', 'api_auth_token'];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/'
      });
    });
    
    return response;
  }
}
