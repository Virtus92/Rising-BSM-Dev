/**
 * Login API Route Handler
 * Handles user authentication and token generation
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';

/**
 * Login handler for POST /api/auth/login
 * Authenticates a user and returns access and refresh tokens
 */
export async function loginHandler(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get the auth service
    const authService = serviceFactory.createAuthService();
    
    // Parse request data
    const data = await request.json();
    const { email, password, remember = false } = data;

    // Validate input
    if (!email || !password) {
      return formatResponse.error('Email and password are required', 400);
    }

    // Perform login
    const result = await authService.login({
      email,
      password,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      rememberMe: remember
    });
    
    // Get token expiration from security config
    const securityConfig = getServiceFactory().createSecurityConfig();
    const accessExpiration = securityConfig.getAccessTokenLifetime(); // default 15 minutes
    const refreshExpiration = securityConfig.getRefreshTokenLifetime(); // default 30 days
    
    // Add expiration fields if not already present
    result.accessExpiration = result.accessExpiration || accessExpiration;
    result.refreshExpiration = result.refreshExpiration || refreshExpiration;
    
    // Log expiration information
    logger.info('Token expiration settings', { 
      accessExpiration: `${Math.floor(accessExpiration / 60)} minutes`, 
      refreshExpiration: `${Math.floor(refreshExpiration / 60 / 60 / 24)} days` 
    });
    
    // Log successful login
    logger.info('User logged in successfully', { userId: result.user.id });
    
    // Create response
    const response = formatResponse.success({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      },
      // Include tokens in response body for client-side storage backup
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Login successful');
    
    // Set HTTP-only cookies with proper settings
    response.cookies.set({
      name: 'auth_token',
      value: result.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
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
    
    return formatResponse.error(message, status);
  }
}
