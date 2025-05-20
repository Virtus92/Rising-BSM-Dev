'use client';

/**
 * AuthServiceSingleton.ts
 * 
 * An improved singleton registry for the authentication service that properly
 * handles Hot Module Replacement (HMR) and prevents initialization race conditions.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * AuthServiceSingleton - A registry that manages auth service initialization with proper HMR handling
 */
class AuthServiceSingleton {
  private static lockRegistry = new Map<string, {
    lockId: string;
    acquiredAt: number;
    expiresAt: number;
    releaseCallback: (() => void) | null;
  }>();
  
  private static singletonVersion = 0;
  private static isHmrInProgress = false;
  
  /**
   * Get the current singleton version
   */
  public static getSingletonVersion(): number {
    return this.singletonVersion;
  }
  
  /**
   * Increment singleton version - used during HMR
   */
  public static incrementSingletonVersion(): number {
    this.singletonVersion += 1;
    logger.debug(`HMR detected: incrementing singleton version to ${this.singletonVersion}`);
    return this.singletonVersion;
  }
  
  /**
   * Check if HMR is in progress
   */
  public static isHmrActive(): boolean {
    return this.isHmrInProgress;
  }
  
  /**
   * Set HMR status
   */
  public static setHmrStatus(active: boolean): void {
    // Only log when state changes
    if (this.isHmrInProgress !== active) {
      logger.debug(`HMR status changed to ${active ? 'active' : 'inactive'}`);
    }
    this.isHmrInProgress = active;
  }
  
  /**
   * Acquire an initialization lock with proper timeout
   * 
   * @param lockName - The name of the lock to acquire
   * @param timeoutMs - Maximum time to hold the lock in milliseconds
   * @returns A callback to release the lock
   */
  public static async acquireInitLock(lockName: string, timeoutMs: number = 30000): Promise<() => void> {
    const lockId = crypto.randomUUID().substring(0, 8);
    
    // Check if lock is already held
    const existingLock = this.lockRegistry.get(lockName);
    if (existingLock) {
      // Check if lock is expired
      if (Date.now() > existingLock.expiresAt) {
        // Lock is expired, forcefully release it
        logger.warn(`Force releasing expired lock ${lockName}:${existingLock.lockId}`, {
          lockId: existingLock.lockId,
          acquiredAt: new Date(existingLock.acquiredAt).toISOString(),
          expiresAt: new Date(existingLock.expiresAt).toISOString(),
          elapsedMs: Date.now() - existingLock.acquiredAt
        });
        
        // Remove from registry
        this.lockRegistry.delete(lockName);
      } else {
        // Wait for lock to be released
        logger.debug(`Waiting for lock ${lockName}:${existingLock.lockId} to be released`, {
          lockId,
          existingLockId: existingLock.lockId
        });
        
        let attempt = 1;
        const maxAttempts = 10;
        const delayMs = 100;
        
        while (attempt <= maxAttempts) {
          // Short delay before checking again
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
          
          // If lock is now free, proceed
          if (!this.lockRegistry.has(lockName)) {
            break;
          }
          
          // If we've hit the maximum attempts, forcefully acquire the lock
          if (attempt === maxAttempts) {
            logger.warn(`Forcefully acquiring lock ${lockName} after waiting ${maxAttempts} attempts`, {
              lockId,
              existingLockId: existingLock.lockId
            });
            
            // Remove existing lock
            this.lockRegistry.delete(lockName);
            break;
          }
          
          attempt++;
        }
      }
    }
    
    // Register new lock
    const now = Date.now();
    const expiresAt = now + timeoutMs;
    
    const releaseCallback = () => {
      const lock = this.lockRegistry.get(lockName);
      if (lock && lock.lockId === lockId) {
        this.lockRegistry.delete(lockName);
        logger.debug(`Released initialization lock for ${lockName}`, { lockId });
      }
    };
    
    this.lockRegistry.set(lockName, {
      lockId,
      acquiredAt: now,
      expiresAt,
      releaseCallback
    });
    
    logger.debug(`Acquired initialization lock for ${lockName}`, { lockId });
    
    // Return release function
    return releaseCallback;
  }
  
  /**
   * Reset all locks - useful for testing and emergencies
   */
  public static resetAllLocks(): void {
    const lockCount = this.lockRegistry.size;
    this.lockRegistry.clear();
    logger.debug(`Reset all locks (${lockCount} locks cleared)`);
  }
}

// HMR handler
if (typeof module !== 'undefined' && (module as any).hot) {
  // Mark as in HMR when starting to unload
  (module as any).hot.dispose(() => {
    AuthServiceSingleton.setHmrStatus(true);
    AuthServiceSingleton.incrementSingletonVersion();
    logger.debug('HMR dispose event: incrementing singleton version and setting HMR status');
  });
  
  // Mark as completed after module is reloaded
  (module as any).hot.accept(() => {
    setTimeout(() => {
      AuthServiceSingleton.setHmrStatus(false);
      logger.debug('HMR accept event: HMR completed');
    }, 500);
  });
}

export default AuthServiceSingleton;