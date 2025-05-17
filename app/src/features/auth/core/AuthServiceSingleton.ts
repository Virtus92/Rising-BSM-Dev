'use client';

/**
 * AuthServiceSingleton.ts
 *
 * Ensures a true singleton pattern for AuthService with proper HMR handling.
 * This module fixes the root cause of multiple competing instances by:
 * 1. Using a globally scoped registry for singletons
 * 2. Proper HMR detection and cleanup
 * 3. Mutex locking for initialization to prevent race conditions
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Global registry key - must be attached to window or global scope
const GLOBAL_SINGLETON_REGISTRY = '__AUTH_SINGLETON_REGISTRY__';

// Global mutex tracking for initialization
const GLOBAL_MUTEX_REGISTRY = '__AUTH_MUTEX_REGISTRY__';

// Type definition for singleton instance
export interface SingletonEntry<T> {
  instance: T;
  instanceId: string;
  created: number;
  hmrVersion: number; // Track HMR version
  cleanupFn?: () => void; // Optional cleanup function
}

// Interface for mutex tracking
export interface MutexEntry {
  key: string;
  locked: boolean;
  timeout: number;
  waitingCount: number;
  lockedAt: number;
  lockerId: string;
}

/**
 * Generic singleton registry to provide proper singleton pattern
 * with HMR support and initialization locking
 */
export class SingletonRegistry {
  // Current HMR version counter to detect reloads
  private static hmrVersion = 1;

  /**
   * Check if hot module replacement is active
   */
  private static isHmrActive(): boolean {
    return typeof module !== 'undefined' && 
           !!(module as any).hot && 
           process.env.NODE_ENV !== 'production';
  }

  /**
   * Initialize the global registries
   */
  private static initializeGlobalRegistry(): void {
    if (typeof window === 'undefined') return;

    // Initialize singleton registry
    if (!(window as any)[GLOBAL_SINGLETON_REGISTRY]) {
      (window as any)[GLOBAL_SINGLETON_REGISTRY] = {};
    }

    // Initialize mutex registry
    if (!(window as any)[GLOBAL_MUTEX_REGISTRY]) {
      (window as any)[GLOBAL_MUTEX_REGISTRY] = {};
    }

    // When HMR is active, increment version on module reload
    if (this.isHmrActive() && (module as any).hot) {
      this.hmrVersion++;
      logger.debug(`HMR detected: incrementing singleton version to ${this.hmrVersion}`);

      // Register for cleanup on HMR dispose
      (module as any).hot.dispose(() => {
        logger.debug('HMR dispose triggered - cleaning up singletons');
        // Don't actually delete instances during HMR, just run cleanup functions
        this.runCleanupFunctions();
      });
    }
  }

  /**
   * Run cleanup functions for all singleton instances
   */
  private static runCleanupFunctions(): void {
    if (typeof window === 'undefined') return;

    const registry = (window as any)[GLOBAL_SINGLETON_REGISTRY];
    if (!registry) return;

    Object.entries(registry).forEach(([key, entry]) => {
      const typedEntry = entry as SingletonEntry<any>;
      if (typedEntry && typeof typedEntry.cleanupFn === 'function') {
        try {
          typedEntry.cleanupFn();
          logger.debug(`Cleanup function executed for ${key}`, {
            instanceId: typedEntry.instanceId
          });
        } catch (error) {
          logger.error(`Error in cleanup function for ${key}`, {
            error: error instanceof Error ? error.message : String(error),
            instanceId: typedEntry.instanceId
          });
        }
      }
    });
  }

  /**
   * Set a cleanup function for a singleton instance
   */
  public static setCleanupFunction<T>(key: string, cleanupFn: () => void): void {
    if (typeof window === 'undefined') return;

    const registry = (window as any)[GLOBAL_SINGLETON_REGISTRY];
    if (!registry || !registry[key]) return;

    const entry = registry[key] as SingletonEntry<T>;
    entry.cleanupFn = cleanupFn;

    logger.debug(`Set cleanup function for ${key}`, {
      instanceId: entry.instanceId
    });
  }

  /**
   * Get an existing singleton instance or create a new one with proper HMR handling
   */
  public static getSingleton<T>(
    key: string,
    factory: () => T,
    options?: { forceNew?: boolean; cleanupFn?: () => void }
  ): T {
    // Initialize global registry if needed
    this.initializeGlobalRegistry();

    if (typeof window === 'undefined') {
      // Server-side - always create a new instance
      return factory();
    }

    // Get existing instance if available and not forced to create new
    const registry = (window as any)[GLOBAL_SINGLETON_REGISTRY];
    const existingEntry = registry[key] as SingletonEntry<T> | undefined;

    // Only reuse instance if not forced to create new and HMR version matches
    if (existingEntry && !options?.forceNew && existingEntry.hmrVersion === this.hmrVersion) {
      return existingEntry.instance;
    }

    // Run cleanup function if exists
    if (existingEntry && typeof existingEntry.cleanupFn === 'function') {
      try {
        existingEntry.cleanupFn();
        logger.debug(`Executed cleanup for existing ${key} instance`, { 
          instanceId: existingEntry.instanceId 
        });
      } catch (e) {
        logger.warn(`Error in cleanup function for ${key}`, {
          error: e instanceof Error ? e.message : String(e),
          instanceId: existingEntry.instanceId
        });
      }
    }

    // Create new instance
    const instance = factory();
    const instanceId = `${key}-${crypto.randomUUID().substring(0, 8)}`;

    // Register the new instance globally
    registry[key] = {
      instance,
      instanceId,
      created: Date.now(),
      hmrVersion: this.hmrVersion,
      cleanupFn: options?.cleanupFn
    };

    logger.debug(`Created new singleton instance for ${key}`, { 
      instanceId,
      hmrVersion: this.hmrVersion,
      isHmrActive: this.isHmrActive(),
      forceNew: !!options?.forceNew
    });

    return instance;
  }

  /**
   * Clear a singleton instance from the registry
   */
  public static clearSingleton(key: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const registry = (window as any)[GLOBAL_SINGLETON_REGISTRY];
    if (registry && registry[key]) {
      // Run cleanup function if exists
      const entry = registry[key] as SingletonEntry<any>;
      if (entry && typeof entry.cleanupFn === 'function') {
        try {
          entry.cleanupFn();
        } catch (e) {
          logger.warn(`Error in cleanup function for ${key}`, {
            error: e instanceof Error ? e.message : String(e),
            instanceId: entry.instanceId
          });
        }
      }

      delete registry[key];
      logger.debug(`Cleared singleton instance for ${key}`);
      return true;
    }

    return false;
  }

  /**
   * Acquire a mutex lock for initialization with timeout and proper HMR handling
   * Returns a release function to later release the lock
   */
  public static async acquireInitLock(key: string, timeoutMs: number = 30000): Promise<() => void> {
    if (typeof window === 'undefined') {
      // Server-side - no lock needed
      return () => {};
    }

    // Initialize registries
    this.initializeGlobalRegistry();
    
    const mutexRegistry = (window as any)[GLOBAL_MUTEX_REGISTRY];
    const lockId = crypto.randomUUID().substring(0, 8);
    
    // Function to release the lock
    const releaseLock = () => {
      if (mutexRegistry[key] && mutexRegistry[key].lockerId === lockId) {
        mutexRegistry[key].locked = false;
        mutexRegistry[key].lockedAt = 0;
        mutexRegistry[key].waitingCount = Math.max(0, mutexRegistry[key].waitingCount - 1);
        logger.debug(`Released initialization lock for ${key}`, { lockId });
      }
    };

    // Initialize mutex if needed
    if (!mutexRegistry[key]) {
      mutexRegistry[key] = {
        key,
        locked: false,
        timeout: timeoutMs,
        waitingCount: 0,
        lockedAt: 0,
        lockerId: ''
      };
    }

    // Check for stale locks (timeout)
    if (mutexRegistry[key].locked) {
      const now = Date.now();
      const lockAge = now - mutexRegistry[key].lockedAt;
      
      if (lockAge > mutexRegistry[key].timeout) {
        // Lock is stale, force release it
        logger.warn(`Found stale initialization lock for ${key}, releasing`, {
          age: lockAge,
          timeout: mutexRegistry[key].timeout,
          oldLockerId: mutexRegistry[key].lockerId
        });
        
        mutexRegistry[key].locked = false;
        mutexRegistry[key].lockedAt = 0;
      }
    }

    // Try to acquire the lock
    if (!mutexRegistry[key].locked) {
      // Lock is available, acquire it
      mutexRegistry[key].locked = true;
      mutexRegistry[key].lockedAt = Date.now();
      mutexRegistry[key].lockerId = lockId;
      logger.debug(`Acquired initialization lock for ${key}`, { lockId });
      
      return releaseLock;
    }

    // Lock is not available, wait for it
    mutexRegistry[key].waitingCount = (mutexRegistry[key].waitingCount || 0) + 1;
    logger.debug(`Another initialization process is running, waiting`, {
      key,
      waitingCount: mutexRegistry[key].waitingCount,
      lockedAt: new Date(mutexRegistry[key].lockedAt).toISOString()
    });

    // Wait for the lock with a timeout
    try {
      await new Promise<void>((resolve, reject) => {
        let intervalId: NodeJS.Timeout | null = null;
        const timeoutId = setTimeout(() => {
          if (intervalId) clearInterval(intervalId);
          reject(new Error(`Timeout waiting for initialization lock for ${key}`));
        }, timeoutMs);

        // Check periodically if the lock is available
        intervalId = setInterval(() => {
          if (!mutexRegistry[key].locked) {
            clearTimeout(timeoutId);
            clearInterval(intervalId!);
            resolve();
          }
        }, 100);
      });

      // Lock is now available, acquire it
      mutexRegistry[key].locked = true;
      mutexRegistry[key].lockedAt = Date.now();
      mutexRegistry[key].lockerId = lockId;
      logger.debug(`Acquired initialization lock for ${key} after waiting`, { lockId });
      
      return releaseLock;
    } catch (error) {
      // Timeout or other error
      mutexRegistry[key].waitingCount = Math.max(0, mutexRegistry[key].waitingCount - 1);
      logger.error(`Failed to acquire initialization lock for ${key}`, {
        error: error instanceof Error ? error.message : String(error),
        lockId
      });
      
      return () => {}; // Return empty release function
    }
  }
}

export default SingletonRegistry;