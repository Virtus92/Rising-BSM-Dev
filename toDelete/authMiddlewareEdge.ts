/**
 * Enhanced Edge Runtime-compatible Authentication Middleware
 * 
 * This middleware provides a comprehensive JWT verification approach that works in Edge Runtime
 * with improved token refresh handling, expiration management, and error recovery.
 * 
 * Key improvements:
 * 1. Better token extraction from multiple sources
 * 2. Enhanced expiration handling with grace periods
 * 3. Improved user data extraction with error recovery
 * 4. Structured response format for easier client-side handling
 * 5. Compatibility with the centralized AuthService architecture
 */
import { NextRequest } from 'next/server';
import { securityConfigEdge } from '@/core/config/SecurityConfigEdge';
import { decodeJwt, isTokenExpired, extractUserFromJwt } from '@/features/auth/utils/jwt-edge';

// Configurable settings
const TOKEN_VALIDATION_SETTINGS = {
  // Grace period for recently expired tokens (in seconds)
  TOKEN_EXPIRY_GRACE_PERIOD: 3600, // 1 hour
  // Short grace period for API requests (in seconds)
  API_TOKEN_EXPIRY_GRACE_PERIOD: 120, // 2 minutes
  // Maximum token age for expired tokens that can still pass validation
  MAX_TOKEN_AGE_AFTER_EXPIRY: 86400, // 24 hours
};

/**
 * Authentication result interface with enhanced information
 */
export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  };
  error?: string;
  statusCode?: number;
  tokenExpired?: boolean; // Indicates token expiration
  tokenStatus?: 'valid' | 'expired' | 'invalid' | 'missing'; // More detailed token status
  expiresIn?: number; // Seconds until token expires (when available)
  needsRefresh?: boolean; // Flag to indicate token should be refreshed proactively
}

/**
 * Enhanced token extraction with multiple fallbacks
 */
function extractToken(request: NextRequest): string | null {
  try {
    // Priority 1: Authorization header (Bearer token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Priority 2: X-Auth-Token header
    const customHeader = request.headers.get('X-Auth-Token');
    if (customHeader) {
      return customHeader;
    }
    
    // Priority 3: Standard auth_token cookie
    try {
      const cookieToken = request.cookies.get('auth_token')?.value;
      if (cookieToken) {
        return cookieToken;
      }
    } catch (cookieError) {
      console.warn('Error reading auth_token cookie:', cookieError);
    }
    
    // Priority 4: Backup cookies
    const backupCookieOptions = ['auth_token_backup', 'token', 'session_token'];
    for (const cookieName of backupCookieOptions) {
      try {
        const token = request.cookies.get(cookieName)?.value;
        if (token) {
          return token;
        }
      } catch (e) {
        // Continue to next method
      }
    }
    
    // Priority 5: Parse from raw cookie string
    try {
      const cookieString = request.headers.get('cookie');
      if (cookieString) {
        // Try multiple cookie names
        for (const cookieName of ['auth_token', 'auth_token_backup', 'token', 'session_token']) {
          const match = cookieString.match(new RegExp(`${cookieName}=([^;]+)`));
          if (match && match[1]) {
            return decodeURIComponent(match[1]);
          }
        }
      }
    } catch (parseError) {
      console.warn('Error parsing cookies string directly:', parseError);
    }
    
    return null;
  } catch (error) {
    console.error('Fatal error extracting token:', error);
    return null;
  }
}

/**
 * Basic JWT validation without cryptographic verification
 * Validates essential claims but handles expiration separately
 */
function validateBasicClaims(decoded: any): void {
  const now = Math.floor(Date.now() / 1000);
  
  // Check not before
  if (decoded.nbf && decoded.nbf > now) {
    throw new Error('Token not yet valid');
  }
  
  // Check required claims
  if (!decoded.sub) {
    throw new Error('Missing subject claim');
  }
  
  if (!decoded.email) {
    throw new Error('Missing email claim');
  }
  
  // Check issuer if configured
  const options = securityConfigEdge.getJwtVerifyOptions();
  if (options.issuer && decoded.iss !== options.issuer) {
    console.error(`JWT issuer mismatch: expected=${options.issuer}, actual=${decoded.iss || 'undefined'}`);
    throw new Error(`Invalid issuer: expected ${options.issuer}, got ${decoded.iss || 'undefined'}`);
  }
  
  // Check audience if configured
  if (options.audience && decoded.aud !== options.audience) {
    throw new Error('Invalid audience');
  }
}

/**
 * Validate token via API call with enhanced error handling
 */
async function validateTokenViaApi(token: string): Promise<{
  valid: boolean;
  response?: any;
}> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
      // Use relative URL to ensure it works in all environments
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return { valid: false };
      }
      
      const data = await response.json();
      return { 
        valid: data.valid === true,
        response: data
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Token validation API request timed out');
        return { valid: false };
      }
      
      console.error('Token validation API error:', error);
      return { valid: false };
    }
  } catch (error) {
    console.error('Fatal error during token validation:', error);
    return { valid: false };
  }
}

/**
 * Calculate token expiration details
 */
function getTokenExpirationDetails(decoded: any): {
  expired: boolean;
  expiredSecondsAgo?: number;
  expiresIn?: number;
  needsRefresh?: boolean;
} {
  if (!decoded || !decoded.exp) {
    return { expired: true };
  }
  
  const now = Math.floor(Date.now() / 1000);
  const expTime = decoded.exp;
  
  if (expTime <= now) {
    return { 
      expired: true,
      expiredSecondsAgo: now - expTime
    };
  }
  
  // Token is still valid - check if it needs refresh soon
  const expiresIn = expTime - now;
  const needsRefresh = expiresIn < 300; // Less than 5 minutes remaining
  
  return {
    expired: false,
    expiresIn,
    needsRefresh
  };
}

/**
 * Enhanced authenticate request for Edge Runtime with thorough token handling
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract token
    const token = extractToken(request);
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        statusCode: 401,
        tokenStatus: 'missing'
      };
    }
    
    // Decode token (no verification in Edge)
    const decoded = decodeJwt(token);
    
    if (!decoded) {
      return {
        success: false,
        error: 'Invalid token format',
        statusCode: 401,
        tokenStatus: 'invalid'
      };
    }
    
    // Get token expiration details
    const { expired, expiredSecondsAgo, expiresIn, needsRefresh } = getTokenExpirationDetails(decoded);
    
    // Extract user first, so we have user details even for expired tokens
    const user = extractUserFromJwt(decoded);
    
    // Enhanced handling for expired tokens
    if (expired) {
      const path = request.nextUrl.pathname;
      console.log(`Token expired for ${path}, expiredSecondsAgo=${expiredSecondsAgo}`);
      
      // For API requests, apply a short grace period if available
      if (path.startsWith('/api/')) {
        // If token expired very recently, still allow it for API requests
        // This gives the client side a chance to refresh the token
        if (expiredSecondsAgo !== undefined && 
            expiredSecondsAgo <= TOKEN_VALIDATION_SETTINGS.API_TOKEN_EXPIRY_GRACE_PERIOD) {
          console.log(`API token expired ${expiredSecondsAgo}s ago - allowing through with refresh signal`);
          
          if (user) {
            return {
              success: true,
              user,
              tokenExpired: true,
              tokenStatus: 'expired',
              needsRefresh: true
            };
          }
        }
        
        // API requests with expired tokens return 401 with special headers
        return {
          success: false,
          error: 'Token expired',
          statusCode: 401,
          tokenExpired: true,
          tokenStatus: 'expired',
          user: user || undefined,
          expiresIn: -1 * (expiredSecondsAgo || 0)
        };
      }
      
      // For non-API (page) requests, we have some flexibility based on request type
      if (request.method === 'GET') {
        // Allow a longer grace period for GET requests to pages
        if (expiredSecondsAgo !== undefined && 
            expiredSecondsAgo <= TOKEN_VALIDATION_SETTINGS.TOKEN_EXPIRY_GRACE_PERIOD) {
          console.log(`Page token expired ${expiredSecondsAgo}s ago - allowing through for client refresh`);
          
          if (user) {
            return {
              success: true,
              user,
              tokenExpired: true,
              tokenStatus: 'expired',
              needsRefresh: true,
              expiresIn: -1 * (expiredSecondsAgo || 0)
            };
          }
        }
      }
      
      // Otherwise, return token expired error
      return {
        success: false,
        error: 'Token expired',
        statusCode: 401,
        tokenExpired: true,
        tokenStatus: 'expired',
        expiresIn: -1 * (expiredSecondsAgo || 0)
      };
    }
    
    // Token isn't expired, validate other claims
    try {
      validateBasicClaims(decoded);
    } catch (error) {
      throw error;
    }
    
    // Check if we need full validation
    const needsFullValidation = 
      process.env.NODE_ENV === 'production' || 
      process.env.JWT_VALIDATE_FULL === 'true';
    
    if (needsFullValidation) {
      const validationResult = await validateTokenViaApi(token);
      if (!validationResult.valid) {
        return {
          success: false,
          error: 'Invalid token signature',
          statusCode: 401,
          tokenStatus: 'invalid'
        };
      }
    }
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid user data in token',
        statusCode: 401,
        tokenStatus: 'invalid'
      };
    }
    
    // Token is valid, return success with user info
    return {
      success: true,
      user,
      tokenStatus: 'valid',
      expiresIn,
      needsRefresh
    };
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Enhanced error response for token expiration
    if (error instanceof Error && error.message === 'Token expired') {
      return {
        success: false,
        error: 'Authentication token expired',
        statusCode: 401,
        tokenExpired: true,
        tokenStatus: 'expired'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      statusCode: 401,
      tokenStatus: 'invalid'
    };
  }
}

/**
 * Get user from request (Edge compatible)
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthResult['user']> {
  const authResult = await authenticateRequest(request);
  return authResult.success ? authResult.user : undefined;
}

/**
 * Public function to handle token expiration redirects
 * Used by middleware to redirect users with expired tokens
 */
export function getExpiredTokenRedirectUrl(request: NextRequest, authResult: AuthResult): URL {
  // Create redirect URL to login page
  const url = new URL('/auth/login', request.url);
  const returnUrl = request.nextUrl.pathname;
  
  // Add query parameters for better user experience
  url.searchParams.set('returnUrl', returnUrl);
  
  // If we know the token is expired, add special reason
  if (authResult.tokenExpired) {
    url.searchParams.set('reason', 'token_expired');
    
    // Add timestamp to prevent caching
    url.searchParams.set('ts', Date.now().toString());
    
    // Add user information if available to help with automatic refresh
    if (authResult.user?.email) {
      url.searchParams.set('user', authResult.user.email);
    }
  } else {
    // General auth failure
    url.searchParams.set('reason', encodeURIComponent(authResult.error || 'Authentication required'));
  }
  
  return url;
}

// Export the authenticate function for middleware
export { authenticateRequest as authenticateRequestEdge };