/**
 * Clean Login Handler
 * 
 * Design principles:
 * 1. Use new auth service
 * 2. Set cookies properly
 * 3. Clear error handling
 * 4. No redundant operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/core/factories/serviceFactory.server';
const authService = getAuthService();
import AuthService from '@/features/auth/core';
import { getLogger } from '@/core/logging';

const logger = getLogger();

export async function loginHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request data
    const data = await request.json();
    const { email, password, remember = false } = data;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Perform login
    const authResponse = await authService.login({ email, password, remember });
    
    // Extract user from auth response
    const user = authResponse.data?.user || authResponse.user;
    
    if (!user) {
      throw new Error('No user data in auth response');
    }
    
    // Create response with backward compatibility properties
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login successful',
      // Backward compatibility properties
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    
    // Tokens are set by AuthService, just add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    logger.info('User logged in successfully', { userId: user.id });
    
    return response;
  } catch (error) {
    logger.error('Login error:', error as Error);
    
    // Determine appropriate error message and status
    let message = 'An error occurred during login';
    let status = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials') || 
          error.message.includes('not found') || 
          error.message.includes('invalid password')) {
        message = 'Invalid email or password';
        status = 401;
      } else if (error.message.includes('not active')) {
        message = 'Account is not active. Please contact admin.';
        status = 403;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}
