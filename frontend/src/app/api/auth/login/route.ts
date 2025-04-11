import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/infrastructure/common/logging';
import { getAuthService } from '@/infrastructure/common/factories';

/**
 * POST /api/auth/login
 * Authenticates a user and returns access and refresh tokens
 */
export async function POST(request: NextRequest) {
  const logger = getLogger();
  
  try {
    // Get the auth service
    const authService = getAuthService();
    
    // Parse request data
    const data = await request.json();
    const { email, password, remember = false } = data;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Perform login
    const result = await authService.login({
      email,
      password,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      rememberMe: remember
    });
    
    // Log successful login
    logger.info('User logged in successfully', { userId: result.user.id });
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role
        },
        // Include tokens in response body for client-side storage backup
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
    
    // Set HTTP-only cookies with proper settings
    response.cookies.set({
      name: 'auth_token',
      value: result.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed to lax to allow cross-site requests during login redirects
      path: '/',
      maxAge: result.accessExpiration // in seconds
    });
    
    response.cookies.set({
      name: 'refresh_token',
      value: result.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: result.refreshExpiration // in seconds
    });
    
    // Add debugging headers
    response.headers.set('X-Token-Set', 'true');
    response.headers.set('X-Auth-User-ID', result.user.id.toString());
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error) {
    // Handle authentication errors
    logger.error('Login error:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
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
      { success: false, message, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status }
    );
  }
}
