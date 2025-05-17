'use client';

/**
 * tokenValidation.ts
 * 
 * A dedicated module for token validation that can be used in middleware
 * and other contexts where static function access is critical.
 * 
 * This file exports individual functions rather than a class to ensure
 * compatibility with various import/export patterns.
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

export interface TokenVerificationResult {
  valid: boolean;
  userId?: number;
  role?: string;
  expiresAt?: Date;
}

/**
 * Verify a JWT token's validity
 * 
 * @param token - The JWT token to verify
 * @returns Token verification result
 */
export async function verifyToken(token: string): Promise<TokenVerificationResult> {
  try {
    if (!token) {
      return { valid: false };
    }

    // Try to decode the token to validate structure and expiration
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Check token expiration
      const expiresAt = new Date(decoded.exp * 1000);
      if (Date.now() >= expiresAt.getTime()) {
        logger.debug('Token is expired');
        return { valid: false };
      }
      
      // Extract user ID
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else {
        userId = parseInt(decoded.sub, 10);
        if (isNaN(userId)) {
          logger.debug('Invalid user ID in token subject claim');
          return { valid: false };
        }
      }
      
      // Basic validation passed (structure and expiration), return success
      return {
        valid: true,
        userId,
        role: decoded.role,
        expiresAt
      };
    } catch (decodeError) {
      logger.error('Token decode error:', decodeError as Error);
      return { valid: false };
    }
  } catch (error) {
    logger.error('Token verification error:', error as Error);
    return { valid: false };
  }
}

/**
 * Extract token information including expiration details
 * 
 * @param token - The JWT token
 * @returns Token information with expiration status
 */
export function getTokenInfo(token: string): {
  expiresAt: Date | null;
  isExpired: boolean;
  remainingTimeMs?: number;
} {
  try {
    if (!token) {
      return {
        expiresAt: null,
        isExpired: true
      };
    }
    
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const expiresAt = new Date(decoded.exp * 1000);
      const now = Date.now();
      const isExpired = now >= expiresAt.getTime();
      const remainingTimeMs = isExpired ? 0 : expiresAt.getTime() - now;
      
      return {
        expiresAt,
        isExpired,
        remainingTimeMs
      };
    } catch (decodeError) {
      logger.error('Error decoding token:', decodeError as Error);
      return {
        expiresAt: null,
        isExpired: true
      };
    }
  } catch (error) {
    logger.error('Error getting token info:', error as Error);
    return {
      expiresAt: null,
      isExpired: true
    };
  }
}

/**
 * Check if token is near expiry
 * 
 * @param token - The JWT token to check
 * @param marginMs - Time margin in milliseconds (default: 5 minutes)
 * @returns Whether the token will expire soon
 */
export function isTokenNearExpiry(token: string, marginMs: number = 5 * 60 * 1000): boolean {
  try {
    if (!token) return false;
    
    const info = getTokenInfo(token);
    
    if (info.isExpired || !info.expiresAt) {
      return false;
    }
    
    // Check if token expires within the margin
    const now = Date.now();
    const timeRemaining = info.expiresAt.getTime() - now;
    
    return timeRemaining < marginMs && timeRemaining > 0;
  } catch (error) {
    logger.error('Error checking token expiry:', error as Error);
    return false;
  }
}
