/**
 * Authentication Diagnostic API
 * 
 * This endpoint provides diagnostic information about the current authentication state,
 * including cookie details, token validation, and server configuration.
 * 
 * IMPORTANT: This should only be enabled in development or testing environments.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';

const logger = getLogger();

export async function GET(request: NextRequest) {
  // Disable in production by default
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTH_DIAGNOSTICS !== 'true') {
    return NextResponse.json(
      { message: 'Authentication diagnostics are disabled in production.' },
      { status: 403 }
    );
  }

  try {
    // Generate a request ID for tracing this diagnostic session
    const requestId = crypto.randomUUID();
    
    // Get all cookies - handle safely with try/catch
    let cookieStore;
    let allCookies: { name: string; value: string }[] = [];
    let authCookies: { name: string; value: string }[] = [];
    let authTokenCookie = null;
    let refreshTokenCookie = null;
    
    try {
      cookieStore = await cookies();
      allCookies = cookieStore.getAll();
      
      // Filter for auth-related cookies only
      authCookies = allCookies.filter(cookie => 
        cookie.name.includes('auth') || 
        cookie.name.includes('token') || 
        cookie.name === 'refresh_token'
      );
      
      // Extract auth token
      authTokenCookie = cookieStore.get('auth_token');
      refreshTokenCookie = cookieStore.get('refresh_token');
    } catch (cookieError) {
      logger.error('Error accessing cookies:', {
        requestId,
        error: cookieError instanceof Error ? cookieError.message : 'Unknown error'
      });
      
      // Continue with empty cookies
      allCookies = [];
      authCookies = [];
    }
    
    // Get auth service for token validation
    const serviceFactory = getServiceFactory();
    const authService = serviceFactory.createAuthService();
    
    // Check token validity
    let tokenValidity = null;
    let tokenDecodeResult = null;
    let tokenInfo = null;
    
    if (authTokenCookie?.value) {
      try {
        // Get token info without validation - RequestCookie doesn't have path, sameSite, secure, expires props
        tokenInfo = {
        length: authTokenCookie.value.length,
        format: authTokenCookie.value.split('.').length === 3 ? 'valid JWT format' : 'invalid format',
        cookiePath: 'N/A', // RequestCookie doesn't have path property
        sameSite: 'N/A', // RequestCookie doesn't have sameSite property
        secure: 'N/A', // RequestCookie doesn't have secure property
        expires: 'session', // RequestCookie doesn't have expires property
        };
        
        // Check token validity
        tokenValidity = await authService.verifyToken(authTokenCookie.value);
        
        // Try to decode token
        // Using JWT decode directly since there's no decodeToken method
        const { jwtDecode } = await import('jwt-decode');
        tokenDecodeResult = jwtDecode(authTokenCookie.value);
      } catch (error) {
        tokenValidity = { 
          valid: false, 
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    // Get server time and environment info
    const serverInfo = {
      time: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development',
      serverHost: request.headers.get('host'),
      clientIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      diagRequestId: requestId
    };
    
    // Log diagnostic info
    logger.info('Auth diagnostic executed', { 
      requestId,
      authCookiesCount: authCookies.length,
      hasAuthToken: !!authTokenCookie,
      hasRefreshToken: !!refreshTokenCookie,
      tokenValid: tokenValidity?.valid === true
    });
    
    // Create diagnostic response
    return NextResponse.json({
      requestId,
      timestamp: Date.now(),
      serverInfo,
      cookies: {
        count: allCookies.length,
        authRelated: authCookies.map(c => ({
          name: c.name,
          path: 'N/A', // RequestCookie doesn't have path property
          sameSite: 'N/A', // RequestCookie doesn't have sameSite property
          secure: 'N/A', // RequestCookie doesn't have secure property
          httpOnly: 'N/A', // RequestCookie doesn't have httpOnly property
          expires: 'session', // RequestCookie doesn't have expires property
          valueLength: c.value?.length || 0
        }))
      },
      auth: {
        authToken: authTokenCookie ? tokenInfo : null,
        refreshToken: refreshTokenCookie ? {
          exists: true,
          path: 'N/A', // RequestCookie doesn't have path property
          sameSite: 'N/A', // RequestCookie doesn't have sameSite property
          secure: 'N/A', // RequestCookie doesn't have secure property
          expires: 'session', // RequestCookie doesn't have expires property
        } : null,
        tokenValidation: tokenValidity,
        tokenDecode: tokenDecodeResult ? {
          success: true,
          userId: tokenDecodeResult.sub,
          expires: tokenDecodeResult.exp ? new Date(tokenDecodeResult.exp * 1000).toISOString() : null,
          issued: tokenDecodeResult.iat ? new Date(tokenDecodeResult.iat * 1000).toISOString() : null,
        } : null
      }
    });
  } catch (error) {
    logger.error('Error in auth diagnostics', { error });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
