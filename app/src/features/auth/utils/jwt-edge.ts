/**
 * Edge Runtime-compatible JWT utilities
 * 
 * Provides basic JWT parsing and manipulation without Node.js crypto module
 */

/**
 * Decode a JWT token without verification
 * This is safe to use in Edge Runtime but does not verify the signature
 * 
 * @param token JWT token to decode
 * @returns Decoded token payload
 */
export function decodeJwt(token: string): any {
  try {
    // Split the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Base64 URL decode the payload
    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(base64UrlDecode(payload), 'binary').toString('utf-8')
    );
    
    return decoded;
  } catch (error) {
    console.error('JWT decode error:', error);
    throw new Error('Invalid token format');
  }
}

/**
 * Base64Url decode a string
 * Handles the specific base64url encoding used by JWT
 * 
 * @param input Base64Url encoded string
 * @returns Decoded binary string
 */
function base64UrlDecode(input: string): string {
  // Convert base64url to base64
  const base64 = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(input.length + (4 - (input.length % 4)) % 4, '=');
  
  // Decode base64
  // Use Buffer in Node.js or atob in Browser/Edge
  if (typeof atob === 'function') {
    return atob(base64);
  } else {
    return Buffer.from(base64, 'base64').toString('binary');
  }
}

/**
 * Edge-compatible function to check token expiration
 * With improved buffer to prevent edge case timing issues
 * 
 * @param decoded Decoded JWT payload
 * @returns Boolean indicating if token is expired
 */
export function isTokenExpired(decoded: any): boolean {
  if (!decoded || !decoded.exp) {
    console.warn('Token missing expiration claim');
    return true;
  }
  
  // Use current time with a larger buffer (30 seconds) to prevent edge case timing issues
  // This gives the client more time to refresh before actual expiration
  const now = Math.floor(Date.now() / 1000) - 30;
  return decoded.exp < now;
}

/**
 * Extract user information from decoded JWT
 * 
 * @param decoded Decoded JWT payload
 * @returns User object or null if invalid
 */
export function extractUserFromJwt(decoded: any): {
  id: number;
  email: string;
  name?: string;
  role?: string;
} | null {
  if (!decoded || !decoded.sub || !decoded.email) {
    return null;
  }
  
  return {
    id: Number(decoded.sub),
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
  };
}
