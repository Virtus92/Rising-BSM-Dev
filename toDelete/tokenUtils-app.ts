'use client';

/**
 * Token utilities for safe token handling and decoding
 * 
 * These utilities help handle tokens safely without throwing exceptions
 * and provide better error handling for malformed tokens.
 */

/**
 * Safely decode a JWT token without throwing exceptions
 * 
 * @param token The JWT token to decode
 * @returns The decoded token payload or null if invalid
 */
export function safeDecodeToken(token: string | null): any {
  if (!token || typeof token !== 'string') {
    console.warn('Invalid or missing token provided to safeDecodeToken');
    return null;
  }
  
  try {
    // Split the token
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.warn(`Invalid JWT format: expected 3 parts, got ${parts.length}`);
      return null;
    }
    
    // Decode the payload
    const payload = parts[1];
    
    // Handle various base64 formats
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode token:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Safely extract user data from a token
 * 
 * @param token The JWT token
 * @returns User data or null if invalid
 */
export function getUserFromToken(token: string | null): any {
  if (!token) return null;
  
  try {
    // Make sure we have a string token
    if (typeof token !== 'string') {
      console.warn('Invalid token type provided to getUserFromToken');
      return null;
    }
    
    // Log token format for debugging in development
    if (process.env.NODE_ENV === 'development') {
      const tokenPreview = token.length > 10 ? `${token.substring(0, 10)}...` : token;
      console.debug(`Processing token: ${tokenPreview} (length: ${token.length})`);
    }
    
    // Decode token with safe method
    const decoded = safeDecodeToken(token);
    if (!decoded) {
      console.warn('Could not decode token in getUserFromToken');
      return null;
    }
    
    // Extract user data from token payload
    return {
      id: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      // Add minimal required fields for user object
      name: decoded.name || '',
      status: 'ACTIVE', // Assume active if they have a token
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.warn('Failed to extract user data from token:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Get token from cookies
 * 
 * @returns The auth token or null if not found
 */
export function getTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1] || null;
  } catch (error) {
    console.warn('Error getting token from cookies:', error);
    return null;
  }
}

/**
 * Check if a token exists and is valid (contains expected parts)
 */
export function hasValidToken(): boolean {
  const token = getTokenFromCookies();
  if (!token) return false;
  
  try {
    const decoded = decodeURIComponent(token);
    const parts = decoded.split('.');
    return parts.length === 3;
  } catch (error) {
    console.warn('Error checking token validity:', error);
    return false;
  }
}
