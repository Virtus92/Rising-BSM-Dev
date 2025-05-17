'use client';

/**
 * clientTokenValidator.ts
 *
 * A unified client-side token validation utility that implements caching
 * and throttling to prevent excessive validation requests.
 */

import { jwtDecode } from 'jwt-decode';
import { getLogger } from '@/core/logging';
import { UserRole } from '@/domain/enums/UserEnums';

const logger = getLogger();

// Type definitions
export interface DecodedToken {
  sub: string | number;
  exp: number;
  iat: number;
  name?: string;
  email?: string;
  role: UserRole;
}

export interface TokenValidationResult {
  valid: boolean;
  userId?: number;
  role?: string;
  expiresAt?: Date;
  remainingMs?: number;
  fromCache?: boolean;
}

// Cache configuration
const CACHE_TTL_MS = 120000; // 2 minutes 
const THROTTLE_MS = 5000;    // 5 seconds minimum between server calls

// Validation cache
interface ValidationCacheEntry {
  result: TokenValidationResult;
  timestamp: number;
}

// Cache and throttling state
const validationCache: Map<string, ValidationCacheEntry> = new Map();
let lastServerCallTime = 0;
let pendingPromise: Promise<TokenValidationResult> | null = null;

/**
 * Client-side token validation with caching and throttling
 * to prevent excessive server requests.
 */
export async function validateToken(token: string): Promise<TokenValidationResult> {
  if (!token) {
    return { valid: false };
  }
  
  try {
    // Step 1: Check cache first (using token prefix as key to avoid storing the full token)
    const cacheKey = token.split('.')[0] || token.substring(0, 10);
    const cachedResult = validationCache.get(cacheKey);
    const now = Date.now();
    
    // Return from cache if entry is still valid
    if (cachedResult && (now - cachedResult.timestamp) < CACHE_TTL_MS) {
      return { 
        ...cachedResult.result,
        fromCache: true
      };
    }
    
    // Step 2: Perform basic client-side validation
    let clientResult: TokenValidationResult;
    try {
      clientResult = validateTokenLocally(token);
      
      // If token is obviously invalid, return immediately
      if (!clientResult.valid) {
        return clientResult;
      }
    } catch (error) {
      logger.error('Error in local token validation:', error as Error);
      return { valid: false };
    }
    
    // Step 3: Handle throttling for server-side validation
    const timeSinceLastCall = now - lastServerCallTime;
    
    // If we're within throttle window, use local validation result
    if (timeSinceLastCall < THROTTLE_MS) {
      logger.debug('Using local validation result due to throttling', { 
        timeSinceLastCall,
        throttleMs: THROTTLE_MS
      });
      
      // Store in cache
      validationCache.set(cacheKey, {
        result: clientResult,
        timestamp: now
      });
      
      return clientResult;
    }
    
    // Step 4: Wait for any pending validation to complete
    if (pendingPromise) {
      return pendingPromise;
    }
    
    // Step 5: Perform server-side validation
    try {
      // Create a new validation promise and store reference
      pendingPromise = performServerValidation(token);
      
      // Update last call time
      lastServerCallTime = now;
      
      // Await the validation
      const serverResult = await pendingPromise;
      
      // Update cache with server result
      validationCache.set(cacheKey, {
        result: serverResult,
        timestamp: now
      });
      
      return serverResult;
    } catch (error) {
      logger.error('Error in server token validation:', error as Error);
      
      // Fall back to client result on server error
      validationCache.set(cacheKey, {
        result: clientResult,
        timestamp: now
      });
      
      return clientResult;
    } finally {
      // Clear pending promise reference
      pendingPromise = null;
    }
  } catch (error) {
    logger.error('Unexpected error in token validation:', error as Error);
    return { valid: false };
  }
}

/**
 * Validate token locally without server call
 */
function validateTokenLocally(token: string): TokenValidationResult {
  try {
    // Decode token
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check expiration
    const now = Date.now();
    const expiresAt = new Date(decoded.exp * 1000);
    
    if (now >= expiresAt.getTime()) {
      return { valid: false };
    }
    
    // Parse user ID
    let userId: number;
    if (typeof decoded.sub === 'number') {
      userId = decoded.sub;
    } else {
      userId = parseInt(decoded.sub, 10);
      if (isNaN(userId)) {
        return { valid: false };
      }
    }
    
    // Return validation result
    return {
      valid: true,
      userId,
      role: decoded.role,
      expiresAt,
      remainingMs: expiresAt.getTime() - now
    };
  } catch (error) {
    logger.error('Error decoding token:', error as Error);
    return { valid: false };
  }
}

/**
 * Perform server-side token validation
 */
async function performServerValidation(token: string): Promise<TokenValidationResult> {
  try {
    // Generate unique request ID for tracking
    const requestId = crypto.randomUUID();
    
    // First try the local validation - it's faster and more reliable
    const localResult = validateTokenLocally(token);
    
    // If local validation fails, no need to check with server
    if (!localResult.valid) {
      return localResult;
    }
    
    // Determine the base URL to use - ensure it ends up as an absolute URL
    let baseUrl: string;
    if (typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    } else {
      baseUrl = 'http://localhost:3000';
    }
    
    // Try different validation endpoints to maximize chances of success
    const validateEndpoints = [
      '/api/auth/validate-token', 
      '/api/auth/validate'
    ];
    
    for (const endpoint of validateEndpoints) {
      try {
        // Create a properly formed URL with cache-busting parameter
        const validateUrl = new URL(endpoint, baseUrl).toString();
        const url = `${validateUrl}?_=${Date.now()}`;
        
        // Perform the validation call
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'X-Request-ID': requestId
          },
          body: JSON.stringify({ token }), // Include token in body as well
          cache: 'no-store',
          credentials: 'include'
        });
        
        // Handle server response
        if (!response.ok) {
          logger.warn(`Server validation failed at ${endpoint}`, { 
            status: response.status,
            requestId,
            endpoint
          });
          continue; // Try next endpoint
        }
        
        // Parse response data
        const data = await response.json();
        
        // Check if validation succeeded
        if (data.success && (data.valid || data.data?.valid)) {
          // Extract user info from validation response
          const userId = data.userId || data.data?.userId || localResult.userId;
          const role = data.role || data.data?.role || localResult.role;
          const expiresAt = data.expiresAt ? new Date(data.expiresAt) : localResult.expiresAt;
          
          // Return successful validation result
          return {
            valid: true,
            userId,
            role,
            expiresAt: expiresAt || new Date(Date.now() + 900000) // Default 15 min
          };
        }
      } catch (endpointError) {
        logger.warn(`Error validating token with endpoint ${endpoint}:`, { 
          error: endpointError instanceof Error ? endpointError.message : String(endpointError) 
        });
        // Try next endpoint
      }
    }
    
    // If all server validations fail, fallback to local result
    logger.debug('All server validations failed, using local result');
    return localResult;
  } catch (error) {
    logger.error('Server validation error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // On any error, return the local validation result
    return validateTokenLocally(token);
  }
}

/**
 * Clear the validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear();
  lastServerCallTime = 0;
  pendingPromise = null;
}

// Export as default and named export
export default {
  validateToken,
  clearValidationCache
};
