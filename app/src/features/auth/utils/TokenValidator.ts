'use client';

/**
 * TokenValidator.ts
 * 
 * Service for token validation with static methods that can be used
 * by middleware or anywhere that needs to validate tokens without 
 * a full authentication system initialization.
 */

import { jwtDecode } from 'jwt-decode';
import { getLogger } from '@/core/logging';

const logger = getLogger();

// Interface for token payload
export interface DecodedToken {
  sub: string | number;
  exp: number;
  iat: number;
  role?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

// Interface for verification result
export interface TokenVerificationResult {
  valid: boolean;
  userId?: number;
  role?: string;
  expiresAt?: Date;
  error?: string;
  serverValidated?: boolean;
}

/**
 * Token validation service with static methods
 */
export class TokenValidator {
  /**
   * Verify a token's validity - robust implementation with circuit breaker
   */
  public static async verifyToken(token: string): Promise<TokenVerificationResult> {
    // For tracking request success/failure
    let serverValidationSuccess = false;
    const requestId = crypto.randomUUID().substring(0, 8);
    
    try {
      // Check if token is present
      if (!token) {
        return { valid: false, error: 'No token provided' };
      }
      
      // Check token format
      if (!token.includes('.') || token.split('.').length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }
      
      // Decode token
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Check for required claims
      if (!decoded.sub) {
        return { valid: false, error: 'Token missing subject claim' };
      }
      
      if (!decoded.exp) {
        return { valid: false, error: 'Token missing expiration claim' };
      }
      
      // Check expiration
      const now = Date.now();
      const expiresAt = new Date(decoded.exp * 1000);
      const remainingTimeMs = expiresAt.getTime() - now;
      
      // Log token expiration details for diagnostics
      logger.debug('Token validation', {
        createdAt: new Date(decoded.iat * 1000).toISOString(),
        expiresAt: expiresAt.toISOString(),
        timeRemaining: `${Math.round(remainingTimeMs / 1000)} seconds`,
        isExpired: now >= expiresAt.getTime()
      });
      
      // Add a small grace period (5 seconds) to account for clock skew
      // but never accept tokens that are explicitly expired
      if (now > expiresAt.getTime()) {
        return { 
          valid: false, 
          error: 'Token is expired',
          expiresAt
        };
      }
      
      // Extract user ID
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else {
        userId = parseInt(decoded.sub, 10);
        if (isNaN(userId)) {
          return { valid: false, error: 'Invalid user ID in token' };
        }
      }
      
      // Track server validation failures to implement circuit breaker pattern
      const failureKey = '_tokenValidationFailures';
      let validationFailures = 0;
      let lastFailureTime = 0;
      
      // Get the current failure count from sessionStorage
      try {
        const storedFailures = sessionStorage.getItem(failureKey);
        if (storedFailures) {
          const failureData = JSON.parse(storedFailures);
          validationFailures = failureData.count || 0;
          lastFailureTime = failureData.timestamp || 0;
        }
      } catch (e) {
        // Ignore storage errors
      }
      
      // If too many recent failures, skip server validation (circuit breaker pattern)
      const circuitBreakerThreshold = 5; // Max failures before circuit trips
      const circuitBreakerTimeout = 60000; // 1 minute timeout
      
      const isCircuitOpen = validationFailures >= circuitBreakerThreshold &&
                             (now - lastFailureTime) < circuitBreakerTimeout;
      
      // Only perform server validation if circuit is closed
      if (!isCircuitOpen) {
        try {
          const validationResponse = await fetch('/api/auth/validate-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-Request-ID': requestId
            },
            body: JSON.stringify({ token })
          });
          
          if (!validationResponse.ok) {
            // Increment failure counter and update timestamp
            validationFailures++;
            lastFailureTime = now;
            
            try {
              sessionStorage.setItem(failureKey, JSON.stringify({
                count: validationFailures,
                timestamp: lastFailureTime
              }));
            } catch (e) {
              // Ignore storage errors
            }
            
            logger.warn('Server validation response not OK', {
              status: validationResponse.status,
              requestId
            });
            
            // For 401/403 errors, the token is definitely invalid
            if (validationResponse.status === 401 || validationResponse.status === 403) {
              return { valid: false, error: `Server validation failed: ${validationResponse.status}` };
            }
            
            // For server errors, fall back to local validation
            if (validationResponse.status >= 500) {
              logger.warn('Server error during validation, using local validation', {
                status: validationResponse.status,
                requestId
              });
              // Continue with local validation
            } else {
              // For other errors, reject the token
              return { valid: false, error: `Server validation failed: ${validationResponse.status}` };
            }
          } else {
            // Reset failure counter on success
            try {
              sessionStorage.setItem(failureKey, JSON.stringify({
                count: 0,
                timestamp: now
              }));
            } catch (e) {
              // Ignore storage errors
            }
            
            // Parse the response
            const result = await validationResponse.json();
            
            // If server explicitly rejects the token, it's invalid
            if (!result.success || (result.data && result.data.valid === false)) {
              return { valid: false, error: result.error || 'Server rejected token' };
            }
            
            // Mark that we had successful server validation
            serverValidationSuccess = true;
          }
        } catch (validationError) {
          // Increment failure counter for network errors
          validationFailures++;
          lastFailureTime = now;
          
          try {
            sessionStorage.setItem(failureKey, JSON.stringify({
              count: validationFailures,
              timestamp: lastFailureTime
            }));
          } catch (e) {
            // Ignore storage errors
          }
          
          // Log but continue with local validation for better UX
          logger.warn('Server token validation error', {
            error: validationError instanceof Error ? validationError.message : String(validationError),
            requestId
          });
          
          // We'll trust the local validation when server is unreachable
        }
      } else {
        // Circuit is open, log and skip server validation
        logger.info('Skipping server validation due to circuit breaker', {
          failures: validationFailures,
          lastFailure: new Date(lastFailureTime).toISOString(),
          requestId
        });
      }
      
      // If token survived all checks, it's valid
      // But note in the result whether server validation was successful
      return {
        valid: true,
        userId,
        role: decoded.role,
        expiresAt,
        serverValidated: serverValidationSuccess
      };
    } catch (error) {
      logger.error('Token verification error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestId
      });
      
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown verification error' 
      };
    }
  }
  
  /**
   * Check if a token is near expiration
   */
  public static isTokenNearExpiry(token: string, bufferMinutes: number = 5): boolean {
    try {
      // Decode token
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Check expiration
      const now = Date.now();
      const expiresAt = new Date(decoded.exp * 1000);
      const bufferMs = bufferMinutes * 60 * 1000;
      
      // Check if token expires within buffer time
      return (expiresAt.getTime() - now) < bufferMs;
    } catch (error) {
      // On error, assume token needs refresh
      return true;
    }
  }
}

export default TokenValidator;