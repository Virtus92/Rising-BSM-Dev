'use client';

import { getLogger } from '@/core/logging';
import { jwtDecode } from 'jwt-decode';

// Blacklisted token storage - maps token signature to expiration time
interface BlacklistedToken {
  signature: string;
  expires: number; // Unix timestamp
}

/**
 * TokenBlacklist class for managing invalidated tokens
 * Uses memory storage with automatic cleanup of expired entries
 */
class TokenBlacklist {
  // Blacklist storage - maps user ID to array of blacklisted token signatures
  private blacklistedByUser: Map<string, Set<string>> = new Map();
  
  // All blacklisted tokens with expiration
  private blacklistedTokens: BlacklistedToken[] = [];
  
  // Last cleanup time
  private lastCleanup: number = Date.now();
  
  /**
   * Add a token to the blacklist
   * @param token JWT token or token ID to blacklist
   * @param expiry Expiration time in milliseconds since epoch
   * @param reason Optional reason for blacklisting
   */
  add(token: string, expiry?: number, reason?: string): void {
    try {
      if (!token) {
        console.warn('Attempt to blacklist empty token');
        return;
      }
      
      // If token looks like a JWT (contains periods), process it as a full JWT
      if (token.includes('.')) {
        this.blacklistToken(token);
        return;
      }
      
      // Otherwise, treat it as a token ID and add it directly
      const signature = token;
      const expires = expiry || (Date.now() + 3600 * 1000); // Default 1 hour if not specified
      
      // Remove any existing entry with the same signature
      this.blacklistedTokens = this.blacklistedTokens.filter(
        entry => entry.signature !== signature
      );
      
      // Add to blacklisted tokens
      this.blacklistedTokens.push({
        signature,
        expires
      });
      
      // Periodically clean up expired tokens
      this.cleanupIfNeeded();
      
      if (reason) {
        console.log(`Token blacklisted: ${reason}, expires: ${new Date(expires).toISOString()}`);
      }
    } catch (error) {
      console.error('Error blacklisting token:', error as Error);
    }
  }

  /**
   * Add a token to the blacklist
   * @param token JWT token to blacklist
   */
  blacklistToken(token: string): void {
    try {
      // Extract parts of the token
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        console.warn('Invalid token format for blacklisting');
        return;
      }
      
      // Decode payload to get expiration and user ID
      const decoded = jwtDecode<{ sub?: string | number, exp?: number }>(token);
      
      if (!decoded || !decoded.exp) {
        console.warn('Token missing expiration, cannot blacklist properly');
        return;
      }
      
      // Remove any existing entry with the same signature
      this.blacklistedTokens = this.blacklistedTokens.filter(
        entry => entry.signature !== signature
      );
      
      // Add to blacklisted tokens
      this.blacklistedTokens.push({
        signature,
        expires: decoded.exp * 1000 // Convert to milliseconds
      });
      
      // Also track by user ID if available
      if (decoded.sub) {
        const userId = decoded.sub.toString();
        
        if (!this.blacklistedByUser.has(userId)) {
          this.blacklistedByUser.set(userId, new Set());
        }
        
        this.blacklistedByUser.get(userId)?.add(signature);
      }
      
      // Periodically clean up expired tokens
      this.cleanupIfNeeded();
    } catch (error) {
      console.error('Error blacklisting token:', error as Error);
    }
  }
  
  /**
   * Blacklist all tokens for a specific user
   * @param userId User ID to blacklist tokens for
   */
  blacklistUser(userId: string | number): void {
    const userIdStr = userId.toString();
    
    // Create empty set if needed
    if (!this.blacklistedByUser.has(userIdStr)) {
      this.blacklistedByUser.set(userIdStr, new Set());
    }
    
    // Mark the user as fully blacklisted by adding a special marker
    this.blacklistedByUser.get(userIdStr)?.add('__ALL_TOKENS__');
  }
  
  /**
   * Check if a token is blacklisted
   * @param token JWT token to check
   * @returns true if blacklisted, false otherwise
   */
  isBlacklisted(token: string): boolean {
    try {
      // Extract parts of the token
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        return false;
      }
      
      // First, run cleanup to ensure expired tokens are removed
      this.cleanupNow();
      
      // Check if token is directly blacklisted
      const isDirectlyBlacklisted = this.blacklistedTokens.some(
        entry => entry.signature === signature
      );
      
      if (isDirectlyBlacklisted) {
        // Log for debugging but only in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Token signature ${signature.substring(0, 8)}... is blacklisted`);
        }
        return true;
      }
      
      // Check if user is blacklisted
      try {
        const decoded = jwtDecode<{ sub?: string | number }>(token);
        
        if (!decoded || !decoded.sub) {
          return false;
        }
        
        const userId = decoded.sub.toString();
        const userBlacklist = this.blacklistedByUser.get(userId);
        
        // If user has any blacklisted tokens, check if all tokens are blacklisted
        if (userBlacklist && userBlacklist.has('__ALL_TOKENS__')) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`All tokens for user ${userId} are blacklisted`);
          }
          return true;
        }
        
        // Or check if this specific token is blacklisted
        const isUserTokenBlacklisted = userBlacklist ? userBlacklist.has(signature) : false;
        if (isUserTokenBlacklisted && process.env.NODE_ENV === 'development') {
          console.log(`Specific token for user ${userId} is blacklisted`);
        }
        return isUserTokenBlacklisted;
      } catch (e) {
        console.error('Error decoding token for blacklist check:', e);
        return false;
      }
    } catch (error) {
      console.error('Error checking token blacklist:', error as Error);
      return false;
    }
  }
  
  /**
   * Force cleanup expired tokens immediately
   */
  private cleanupNow(): void {
    const now = Date.now();
    this.lastCleanup = now;
    
    const beforeCount = this.blacklistedTokens.length;
    
    // Remove expired tokens
    this.blacklistedTokens = this.blacklistedTokens.filter(
      entry => entry.expires > now
    );
    
    const removedCount = beforeCount - this.blacklistedTokens.length;
    if (removedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up token blacklist, removed ${removedCount} expired entries, remaining: ${this.blacklistedTokens.length}`);
    }
  }
  
  /**
   * Clean up expired blacklisted tokens
   */
  private cleanupIfNeeded(): void {
    const now = Date.now();
    
    // Only clean up once per hour
    if (now - this.lastCleanup < 3600000) {
      return;
    }
    
    this.cleanupNow();
  }
}

// Export as singleton
export const tokenBlacklist = new TokenBlacklist();
export default tokenBlacklist;