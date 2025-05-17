'use client';

/**
 * One-time cleanup utility for authentication storage
 * Removes all localStorage auth items and standardizes on HTTP-only cookies
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Keys that should be removed from localStorage
const LEGACY_STORAGE_KEYS = [
  // Auth tokens
  'auth_token',
  'auth_token_backup',
  'refresh_token',
  'refresh_token_backup',
  
  // Auth metadata
  'auth_expires_at',
  'auth_expires_timestamp',
  'auth_expires_seconds',
  'auth_init_completed',
  'auth_init_timestamp',
  'auth_timestamp',
  'last_auth_refresh_time',
  
  // Other potential auth-related items
  'user_data',
  'auth_user',
  'user_permissions',
  'auth_state'
];

/**
 * Clean up legacy localStorage auth items
 * @returns Number of items cleaned up
 */
export function cleanupLegacyAuthStorage(): number {
  try {
    if (typeof window === 'undefined') {
      return 0; // Skip in server context
    }
    
    let cleanedCount = 0;
    
    // Check if cleanup has already been done
    if (localStorage.getItem('auth_storage_cleaned') === 'true') {
      logger.debug('Auth storage cleanup already performed');
      return 0;
    }
    
    // Remove each legacy key
    LEGACY_STORAGE_KEYS.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });
    
    // Mark cleanup as done
    if (cleanedCount > 0) {
      localStorage.setItem('auth_storage_cleaned', 'true');
      logger.info(`Cleaned up ${cleanedCount} legacy auth items from localStorage`);
    }
    
    return cleanedCount;
  } catch (error) {
    logger.error('Error during auth storage cleanup:', error as Error);
    return 0;
  }
}

// Run cleanup automatically when this module is imported
if (typeof window !== 'undefined') {
  setTimeout(() => {
    cleanupLegacyAuthStorage();
  }, 1000); // Delay slightly to not block rendering
}

export default { cleanupLegacyAuthStorage };
