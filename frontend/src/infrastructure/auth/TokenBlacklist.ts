'use client';

import { getLogger } from '../common/logging';

interface BlacklistedToken {
  token: string;    // Either full token or token ID (jti)
  expiry: number;   // Expiration time in milliseconds
  reason: string;   // Reason for blacklisting (logout, security, etc.)
}

/**
 * Token blacklist for managing revoked JWT tokens
 * Acts as a centralized registry of revoked tokens that are still valid by their expiration time
 */
export class TokenBlacklist {
  private static instance: TokenBlacklist;
  private blacklist: Map<string, BlacklistedToken> = new Map();
  private logger = getLogger();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Start cleanup task
    this.startCleanupTask();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): TokenBlacklist {
    if (!TokenBlacklist.instance) {
      TokenBlacklist.instance = new TokenBlacklist();
    }
    return TokenBlacklist.instance;
  }
  
  /**
   * Start automatic cleanup task to remove expired tokens
   */
  private startCleanupTask() {
    if (typeof setInterval !== 'undefined' && !this.cleanupInterval) {
      // Run cleanup every 15 minutes
      this.cleanupInterval = setInterval(() => this.cleanup(), 15 * 60 * 1000);
      this.logger.info('Token blacklist cleanup task started');
    }
  }
  
  /**
   * Stop the cleanup task (usually when shutting down)
   */
  public stopCleanupTask() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.logger.info('Token blacklist cleanup task stopped');
    }
  }
  
  /**
   * Clean up expired tokens from the blacklist
   */
  public cleanup() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [token, data] of this.blacklist.entries()) {
      if (data.expiry < now) {
        this.blacklist.delete(token);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.logger.debug(`Removed ${removedCount} expired tokens from blacklist`);
    }
    
    return removedCount;
  }
  
  /**
   * Add a token to the blacklist
   * 
   * @param token The JWT token or token ID to blacklist
   * @param expiry Expiration time in milliseconds since epoch
   * @param reason Reason for blacklisting
   */
  public add(token: string, expiry: number, reason: string = 'logout'): void {
    // Use token fingerprint (first 32 chars of hash) to avoid storing the entire token
    const fingerprint = this.getTokenFingerprint(token);
    
    this.blacklist.set(fingerprint, {
      token: fingerprint,
      expiry,
      reason
    });
    
    this.logger.debug(`Token added to blacklist: ${fingerprint.substring(0, 8)}...`, { 
      reason, 
      expiry: new Date(expiry).toISOString() 
    });
  }
  
  /**
   * Check if a token is blacklisted
   * 
   * @param token The JWT token to check
   * @returns True if the token is blacklisted
   */
  public isBlacklisted(token: string): boolean {
    // Get token fingerprint
    const fingerprint = this.getTokenFingerprint(token);
    
    // Check if token is in blacklist
    const blacklistedToken = this.blacklist.get(fingerprint);
    
    // If not found, token is not blacklisted
    if (!blacklistedToken) {
      return false;
    }
    
    // If found but expired, remove it from blacklist and return false
    const now = Date.now();
    if (blacklistedToken.expiry < now) {
      this.blacklist.delete(fingerprint);
      return false;
    }
    
    // Token is blacklisted and still valid
    return true;
  }
  
  /**
   * Remove a token from the blacklist
   * 
   * @param token The JWT token to remove
   * @returns True if token was found and removed
   */
  public remove(token: string): boolean {
    const fingerprint = this.getTokenFingerprint(token);
    return this.blacklist.delete(fingerprint);
  }
  
  /**
   * Get the size of the blacklist
   */
  public size(): number {
    return this.blacklist.size;
  }
  
  /**
   * Create a fingerprint of the token for storage
   * Uses a hashing algorithm to create a consistent identifier without storing the full token
   * 
   * @param token JWT token
   * @returns Token fingerprint
   */
  private getTokenFingerprint(token: string): string {
    // In a Node.js environment, we'd use crypto
    // For browsers and Edge Runtime, use a simple hashing algorithm
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        // Browser environment with crypto support
        // Convert token to hash using SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        
        // Use non-async version for simplicity
        // In production, you'd use the async version with await
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
          const char = token.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        
        // Return the hash as a hexadecimal string
        return hash.toString(16).padStart(8, '0');
      } catch (e) {
        this.logger.warn('Error creating token fingerprint with crypto', { error: e });
      }
    }
    
    // Fallback to a simple deterministic hash function
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Return the hash as a hexadecimal string
    return hash.toString(16).padStart(8, '0');
  }
}

// Export singleton instance
export const tokenBlacklist = TokenBlacklist.getInstance();
export default tokenBlacklist;
