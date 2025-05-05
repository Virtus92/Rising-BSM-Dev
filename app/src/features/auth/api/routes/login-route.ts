/**
 * Login API Route Handler
 * Handles user authentication and token generation
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { cookies } from 'next/headers'; // Fix: Import cookies from next/headers
import { jwtDecode } from 'jwt-decode'; // Fix: Use jwtDecode instead of jwt.decode

/**
 * Helper function to clean up stale tokens
 */
async function cleanupStaleAuthTokens(request: NextRequest, logger: any): Promise<void> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (authToken) {
      try {
        // Try to decode the token to check if it's expired
        const decoded = jwtDecode(authToken) as any;
        
        if (decoded && decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
          logger.debug('Found expired token in cookies, will be replaced');
        }
      } catch (error) {
        logger.debug('Error decoding token during login, will be replaced', { error });
      }
    }
  } catch (error) {
    // Non-critical error, just log and continue
    logger.debug('Error checking for stale tokens', { error });
  }
}

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

    // Prepare context for login
    const context = {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      device: request.headers.get('sec-ch-ua') || 'unknown-device',
      requestId: request.headers.get('x-request-id') || crypto.randomUUID()
    };
    
    // Attempt to log any prior tokens for this session
    await cleanupStaleAuthTokens(request, logger);
    
    // Perform login with proper context tracking
    const result = await authService.login({
      email,
      password,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      rememberMe: remember
    }, { context });
    
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
    
    // Set HTTP-only cookies with proper security settings
    // Fix: Use the proper NextResponse cookies API structure
    response.cookies.set('auth_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: result.accessExpiration,
    });
    
    response.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: result.refreshExpiration,
    });
    
    // Add security headers
    response.headers.set('X-Token-Set', 'true');
    response.headers.set('X-Auth-User-ID', result.user.id.toString());
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Add tracking information for monitoring
    response.headers.set('X-Request-ID', context.requestId);
    
    // Give the client a session ID (but not the user ID) to help with debugging
    const sessionId = crypto.randomUUID().split('-')[0];
    response.headers.set('X-Session-ID', sessionId);
    
    // Log successful login for monitoring
    logger.info('User authenticated successfully', { 
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      sessionId,
      requestId: context.requestId
    });
    
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
