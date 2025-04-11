/**
 * JWT utilities for server-side API routes
 * These utilities provide a server-compatible way to work with JWTs
 */

import jwt from 'jsonwebtoken';
import { getLogger } from '@/infrastructure/common/logging';

// Get JWT secret from environment variables
export const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'default-secret-change-me';
};

/**
 * Decode a JWT token in a server-compatible way
 * @param token JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken<T = any>(token: string): T | null {
  try {
    // Extract parts of the token
    const [header, payload, signature] = token.split('.');
    
    if (!header || !payload || !signature) {
      return null;
    }
    
    // Decode the payload
    try {
      const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64Payload, 'base64').toString('utf8');
      return JSON.parse(jsonPayload);
    } catch (error) {
      getLogger().error('Error decoding JWT payload:', { error });
      return null;
    }
  } catch (error) {
    getLogger().error('Error processing JWT:', { error });
    return null;
  }
}

/**
 * Verify a JWT token in a server-compatible way
 * @param token JWT token to verify
 * @param secret Secret key for verification (optional, uses default if not provided)
 * @returns Verified token payload or null if invalid
 */
export function verifyToken<T = any>(token: string, secret?: string): T | null {
  try {
    const jwtSecret = secret || getJwtSecret();
    return jwt.verify(token, jwtSecret) as T;
  } catch (error) {
    getLogger().error('Error verifying JWT:', { error });
    return null;
  }
}

/**
 * Extract user ID from a JWT token in a server-compatible way
 * @param token JWT token
 * @returns User ID or null if invalid
 */
export function extractUserId(token: string): number | null {
  const decoded = decodeToken<{ sub?: string | number }>(token);
  
  if (!decoded || !decoded.sub) {
    return null;
  }
  
  if (typeof decoded.sub === 'number') {
    return decoded.sub;
  }
  
  if (typeof decoded.sub === 'string') {
    const userId = parseInt(decoded.sub, 10);
    return isNaN(userId) ? null : userId;
  }
  
  return null;
}

/**
 * Check if a JWT token is expired
 * @param token JWT token
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken<{ exp?: number }>(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

export default {
  decodeToken,
  verifyToken,
  extractUserId,
  isTokenExpired
};
