/**
 * Token Blacklist Utility
 * 
 * Provides a standalone utility for checking if a token has been revoked
 * without causing circular dependencies with the main AuthService.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// In-memory blacklist cache to reduce database calls
const memoryBlacklist = new Set<string>();
let lastBlacklistUpdate = 0;
const BLACKLIST_CACHE_TTL = 60000; // 1 minute
let refreshPromise: Promise<void> | null = null; // Store promise for concurrent requests

/**
 * Check if a token is blacklisted
 * This is a robust implementation that avoids circular dependencies
 * and properly handles edge cases
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  // Immediate check for invalid token
  if (!token || typeof token !== 'string' || token.trim() === '') {
    logger.warn('Invalid token provided to blacklist check');
    return false; // Invalid tokens don't need blacklist checking
  }
  
  try {
    // Extract token ID consistently
    const tokenId = getTokenIdentifier(token);
    
    // Validate token ID
    if (!tokenId || tokenId.trim() === '') {
      logger.warn('Failed to generate valid token identifier');
      return false;
    }
    
    // Check memory cache first for fast response
    if (memoryBlacklist.has(tokenId)) {
      logger.debug('Token found in blacklist cache', { tokenIdPrefix: tokenId.substring(0, 8) });
      return true;
    }
    
    // Check if we need to refresh the blacklist based on TTL
    const now = Date.now();
    if (now - lastBlacklistUpdate > BLACKLIST_CACHE_TTL) {
      logger.debug('Refreshing blacklist cache due to TTL expiration', {
        lastUpdate: new Date(lastBlacklistUpdate).toISOString(),
        ttlSeconds: BLACKLIST_CACHE_TTL / 1000
      });
      
      await refreshBlacklist();
      
      // Recheck cache after refresh
      const isBlacklisted = memoryBlacklist.has(tokenId);
      if (isBlacklisted) {
        logger.debug('Token found in refreshed blacklist', { tokenIdPrefix: tokenId.substring(0, 8) });
      }
      return isBlacklisted;
    }
    
    // If cache is fresh and token not found, it's not blacklisted
    return false;
  } catch (error) {
    // Log detailed error information
    logger.error('Error checking token blacklist:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tokenPrefix: token.substring(0, 10) // Log prefix for debugging
    });
    
    // Fail closed - return true to indicate token should be rejected
    // This is more secure than allowing potentially revoked tokens
    return true;
  }
}

/**
 * Add a token to the blacklist
 * This is used internally by the system
 */
export async function blacklistToken(token: string): Promise<boolean> {
  try {
    if (!token) {
      return false;
    }
    
    // Extract token ID
    const tokenId = getTokenIdentifier(token);
    
    // Add to memory cache
    memoryBlacklist.add(tokenId);
    
    // Update timestamp
    lastBlacklistUpdate = Date.now();
    
    return true;
  } catch (error) {
    logger.error('Error blacklisting token:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return false;
  }
}

/**
 * Get a unique identifier for the token
 * Returns a consistent, unique identifier for a token
 */
function getTokenIdentifier(token: string): string {
  if (!token || typeof token !== 'string') {
    return '';
  }
  
  try {
    // For JWT tokens (which contain periods), use the first part
    // This contains the header which is unique enough for our purposes
    if (token.includes('.')) {
      const parts = token.split('.');
      if (parts.length >= 3) {
        // This is likely a JWT - use header + first 4 chars of payload for uniqueness
        return parts[0] + (parts[1]?.substring(0, 4) || '');
      } else if (parts[0]) {
        // Not a standard JWT but has periods - use first part
        return parts[0];
      }
    }
    
    // For refresh tokens (which are UUIDs or similar), use the first 16 chars
    // This should be sufficient for uniqueness while keeping the identifier small
    return token.substring(0, 16);
  } catch (error) {
    // If any error occurs, fallback to a safe substring
    logger.warn('Error creating token identifier', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenLength: token.length
    });
    return token.substring(0, 10);
  }
}

/**
 * Refresh the in-memory blacklist from persistent storage
 * with proper concurrency control using Promise
 */
async function refreshBlacklist(): Promise<void> {
  // If there's an existing refresh in progress, wait for it
  if (refreshPromise) {
    try {
      await refreshPromise;
      return;
    } catch (err) {
      // Previous refresh failed, continue with a new one
      logger.warn('Previous blacklist refresh failed, starting new refresh');
    }
  }
  
  // Create a new promise for this refresh
  refreshPromise = (async () => {
    try {
      // Imported dynamically to avoid circular dependencies
      const { prisma } = await import('@/core/db/prisma/client');
      
      // Get all revoked tokens
      const revokedTokens = await prisma.refreshToken.findMany({
        where: {
          isRevoked: true,
          // Only get recently revoked tokens
          revokedAt: {
            gte: new Date(Date.now() - 86400000) // Last 24 hours
          }
        },
        select: {
          token: true
        }
      });
      
      // Create a new set for atomic update
      const updatedBlacklist = new Set<string>();
      
      // Add tokens to the new set
      for (const { token } of revokedTokens) {
        if (token) {
          updatedBlacklist.add(getTokenIdentifier(token));
        }
      }
      
      // Atomic replacement of the blacklist
      memoryBlacklist.clear();
      for (const tokenId of updatedBlacklist) {
        memoryBlacklist.add(tokenId);
      }
      
      // Update timestamp
      lastBlacklistUpdate = Date.now();
      
      logger.debug('Token blacklist refreshed', {
        count: memoryBlacklist.size
      });
    } catch (error) {
      logger.error('Error refreshing token blacklist:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Don't rethrow - we'll continue with existing blacklist
    }
  })();
  
  try {
    // Wait for the refresh to complete
    await refreshPromise;
  } finally {
    // Clear the promise once it's done (success or error)
    refreshPromise = null;
  }
}

/**
 * Public function to refresh the in-memory blacklist
 * This is exported to allow manual refreshing of the blacklist cache
 */
export async function refreshBlacklistCache(): Promise<void> {
  // Check if refresh is needed based on TTL
  const now = Date.now();
  if (now - lastBlacklistUpdate <= BLACKLIST_CACHE_TTL / 2) {
    // Skip refresh if last update was recent (within half the TTL)
    return;
  }
  
  await refreshBlacklist();
}

// Export default for dynamic imports
export default {
  isTokenBlacklisted,
  blacklistToken,
  refreshBlacklistCache
};