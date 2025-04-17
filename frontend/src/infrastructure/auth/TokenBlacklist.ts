import { getLogger } from '../common/logging';
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
      
      // Safely decode JWT payload without dependency on external library
      let decoded: { sub?: string | number, exp?: number } = {};
      
      try {
        // First try using jwtDecode if available (client-side)
        if (typeof jwtDecode === 'function') {
          decoded = jwtDecode<{ sub?: string | number, exp?: number }>(token);
        } else {
          // Manual decoding as fallback (server-side)
          const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64Payload, 'base64').toString('utf8');
          decoded = JSON.parse(jsonPayload);
        }
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
        return;
      }
      
      if (!decoded || !decoded.exp) {
        console.warn('Token missing expiration, cannot blacklist properly');
        return;
      }
      
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
      console.error('Error blacklisting token:', error);
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
  /**
   * Add a token to the blacklist with a specific expiration and reason
   * @param tokenOrId Token string or JWT token ID
   * @param expiresAt Expiration timestamp in milliseconds
   * @param reason Reason for blacklisting the token
   */
  add(tokenOrId: string, expiresAt: number, reason?: string): void {
    try {
      // If it looks like a JWT, blacklist the token itself
      if (tokenOrId.includes('.')) {
        this.blacklistToken(tokenOrId);
        return;
      }
      
      // Otherwise, assume it's a token ID and add it to the blacklist
      this.blacklistedTokens.push({
        signature: tokenOrId, // Use the token ID as the signature
        expires: expiresAt
      });
      
      // Clean up expired tokens periodically
      this.cleanupIfNeeded();
    } catch (error) {
      console.error('Error adding token to blacklist:', error);
    }
  }

  isBlacklisted(token: string): boolean {
    try {
      // Extract parts of the token
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        return false;
      }
      
      // Check if token is directly blacklisted
      const isDirectlyBlacklisted = this.blacklistedTokens.some(
        entry => entry.signature === signature
      );
      
      if (isDirectlyBlacklisted) {
        return true;
      }
      
      // Check if user is blacklisted
      try {
        // Safely decode JWT payload without dependency on external library
        // This works in both client and server environments
        let decoded: { sub?: string | number } = {};
        
        try {
          // First try using jwtDecode if available (client-side)
          if (typeof jwtDecode === 'function') {
            decoded = jwtDecode<{ sub?: string | number }>(token);
          } else {
            // Manual decoding as fallback (server-side)
            const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = Buffer.from(base64Payload, 'base64').toString('utf8');
            decoded = JSON.parse(jsonPayload);
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          return false;
        }
        
        if (!decoded || !decoded.sub) {
          return false;
        }
        
        const userId = decoded.sub.toString();
        const userBlacklist = this.blacklistedByUser.get(userId);
        
        // If user has any blacklisted tokens, check if all tokens are blacklisted
        if (userBlacklist && userBlacklist.has('__ALL_TOKENS__')) {
          return true;
        }
        
        // Or check if this specific token is blacklisted
        return userBlacklist ? userBlacklist.has(signature) : false;
      } catch (e) {
        console.error('Error processing token for blacklist check:', e);
        return false;
      }
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false;
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
    
    this.lastCleanup = now;
    
    // Remove expired tokens
    this.blacklistedTokens = this.blacklistedTokens.filter(
      entry => entry.expires > now
    );
    
    console.log(`Cleaned up token blacklist, remaining entries: ${this.blacklistedTokens.length}`);
  }
}

// Export as singleton
export const tokenBlacklist = new TokenBlacklist();
export default tokenBlacklist;
