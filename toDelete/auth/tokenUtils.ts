/**
 * Token utilities for authentication
 * These utilities help with token processing and validation
 */
import { jwtDecode } from 'jwt-decode';

/**
 * Token payload interface
 */
export interface DecodedToken {
  // Standard JWT claims
  iss?: string; // Issuer
  sub?: string; // Subject (usually user ID)
  aud?: string | string[]; // Audience
  exp?: number; // Expiration time
  nbf?: number; // Not before time
  iat?: number; // Issued at time
  jti?: string; // JWT ID
  
  // Custom claims
  userId?: number | string;
  id?: number | string; // Alternative claim for userId
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
}

/**
 * Calculate expiration time from the token
 * @param token JWT token
 * @returns Expiration time in milliseconds, or null if unable to parse
 */
export function getTokenExpiration(token: string): number | null {
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check for expiration time in token
    if (decoded.exp) {
      // JWT exp is in seconds, convert to milliseconds
      return decoded.exp * 1000;
    }
    
    // If no expiration in token, check if we have an issue time
    // and use default expiration of 1 hour from issue time
    if (decoded.iat) {
      // JWT iat is in seconds, add 1 hour (3600 seconds) and convert to ms
      return (decoded.iat + 3600) * 1000;
    }
    
    // If no expiration or issue time, use current time + 15 minutes as fallback
    console.warn('Token has no expiration or issue time, using fallback expiration');
    return Date.now() + (15 * 60 * 1000); // 15 minutes
  } catch (error) {
    console.error('Error decoding token:', error);
  }
  
  return null;
}

/**
 * Extract user information from token
 * @param token JWT token
 * @returns User information or null if invalid token
 */
export function getUserFromToken(token: string): any {
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Handle different user ID formats
    let userId: number | undefined = undefined;
    
    if (decoded.sub !== undefined) {
      userId = typeof decoded.sub === 'number' 
        ? decoded.sub 
        : parseInt(decoded.sub, 10);
    } else if (decoded.userId !== undefined) {
      userId = typeof decoded.userId === 'number' 
        ? decoded.userId 
        : parseInt(String(decoded.userId), 10);
    } else if (decoded.id !== undefined) {
      userId = typeof decoded.id === 'number' 
        ? decoded.id 
        : parseInt(String(decoded.id), 10);
    }
    
    // Skip if we couldn't extract a valid user ID
    if (userId === undefined || isNaN(userId)) {
      console.warn('No valid user ID in token');
      return null;
    }
    
    // Return normalized user object
    return {
      id: userId,
      email: decoded.email || '',
      name: decoded.name || '',
      role: decoded.role || '',
      // Add minimal required fields for user object
      status: 'ACTIVE', // Assume active if they have a token
    };
  } catch (error) {
    console.warn('Failed to extract user data from token:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token JWT token
 * @param bufferSeconds Buffer time in seconds to consider token as expiring soon
 * @returns True if token is expired or expiring soon
 */
export function isTokenExpired(token: string, bufferSeconds: number = 300): boolean {
  if (!token) {
    return true;
  }
  
  try {
    const expiryTime = getTokenExpiration(token);
    
    if (!expiryTime) {
      return true; // No expiry means consider it expired
    }
    
    const now = Date.now();
    const bufferMs = bufferSeconds * 1000;
    
    return now >= expiryTime - bufferMs;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Consider expired on error
  }
}

/**
 * Validate token format
 * @param token JWT token
 * @returns True if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check JWT format (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check if parts are valid base64
  try {
    for (const part of parts) {
      // JWT uses base64url format
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      // This will throw if invalid base64
      atob(base64);
    }
    return true;
  } catch (error) {
    return false;
  }
}
