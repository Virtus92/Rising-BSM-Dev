/**
 * Server-side token blacklist implementation for Edge Runtime
 * This version does not use client-side features and works in middleware
 */

// Edge Runtime compatible decoding function
function base64Decode(str: string): string {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Handle padding
  let paddedBase64 = base64;
  while (paddedBase64.length % 4) {
    paddedBase64 += '=';
  }
  // Use atob which is available in Edge Runtime
  return atob(paddedBase64);
}

// Blacklisted token storage - maps token signature to expiration time
interface BlacklistedToken {
  signature: string;
  expires: number; // Unix timestamp
}

/**
 * TokenBlacklist class for managing invalidated tokens in server/middleware context
 * Uses memory storage with automatic cleanup of expired entries
 */
class TokenBlacklistServer {
  // Blacklist storage - maps user ID to array of blacklisted token signatures
  private blacklistedByUser: Map<string, Set<string>> = new Map();
  
  // All blacklisted tokens with expiration
  private blacklistedTokens: BlacklistedToken[] = [];
  
  // Last cleanup time
  private lastCleanup: number = Date.now();
  
  /**
   * Safe base64 decoding for JWT payloads
   * Handles URL-safe base64 encoding and padding issues
   * Edge Runtime compatible
   */
  private decodeTokenPayload(payload: string): any {
    try {
      // Decode using our Edge Runtime compatible function
      const jsonStr = base64Decode(payload);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error decoding token payload:', error as Error);
      return null;
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
      
      // For server context, safely decode the payload
      const decodedPayload = this.decodeTokenPayload(payload);
      
      if (!decodedPayload || !decodedPayload.exp) {
        console.warn('Token missing expiration, cannot blacklist properly');
        return;
      }
      
      // Add to blacklisted tokens
      this.blacklistedTokens.push({
        signature,
        expires: decodedPayload.exp * 1000 // Convert to milliseconds
      });
      
      // Also track by user ID if available
      if (decodedPayload.sub) {
        const userId = decodedPayload.sub.toString();
        
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
  async isBlacklisted(token: string): Promise<boolean> {
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
        // Log for debugging purposes which signatures are matching
        console.log(`Token signature ${signature.substring(0, 8)}... is blacklisted`);
        return true;
      }
      
      // Check if user is blacklisted by safely decoding payload
      try {
        const decodedPayload = this.decodeTokenPayload(payload);
        
        if (!decodedPayload || !decodedPayload.sub) {
          return false;
        }
        
        const userId = decodedPayload.sub.toString();
        const userBlacklist = this.blacklistedByUser.get(userId);
        
        // If user has any blacklisted tokens, check if all tokens are blacklisted
        if (userBlacklist && userBlacklist.has('__ALL_TOKENS__')) {
          console.log(`All tokens for user ${userId} are blacklisted`);
          return true;
        }
        
        // Or check if this specific token is blacklisted
        const isUserTokenBlacklisted = userBlacklist ? userBlacklist.has(signature) : false;
        if (isUserTokenBlacklisted) {
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
    if (removedCount > 0) {
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
export const tokenBlacklistServer = new TokenBlacklistServer();

// Export individual functions for more convenient imports
export const blacklistToken = (token: string): void => tokenBlacklistServer.blacklistToken(token);
export const blacklistUser = (userId: string | number): void => tokenBlacklistServer.blacklistUser(userId);
export const isBlacklisted = async (token: string): Promise<boolean> => tokenBlacklistServer.isBlacklisted(token);

export default tokenBlacklistServer;