'use client';

/**
 * AuthOptimizations.ts
 * 
 * Registers and initializes auth optimizations for the application
 */
import { getLogger } from '@/core/logging';
import { useEffect } from 'react';

const logger = getLogger();

/**
 * AuthOptimizations component - registers auth optimizations
 * 
 * This component should be included once at the application root level
 * to register and initialize auth optimizations.
 */
export function AuthOptimizations(): null {
  useEffect(() => {
    logger.info('Initializing auth optimizations');
    
    const initializeOptimizations = async () => {
      try {
        // Import optimizations dynamically to prevent circular dependencies
        const [
          { default: TokenCache },
          { default: AuthRequestManager }
        ] = await Promise.all([
          import('./TokenCache'),
          import('./AuthRequestManager')
        ]);
        
        // Configure the TokenCache with appropriate throttling
        TokenCache.setThrottleTime(2000);
        
        // Configure the AuthRequestManager
        AuthRequestManager.configure({
          batchInterval: 100,   // 100ms batching window
          tokenThrottleTime: 2000, // 2s between token requests
          cacheTime: 60000      // 1 minute cache time
        });
        
        logger.info('Auth optimizations initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize auth optimizations', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    };
    
    initializeOptimizations().catch(error => {
      logger.error('Unhandled error in auth optimizations initialization', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    });
    
    return () => {
      logger.debug('Auth optimizations cleanup');
    };
  }, []);
  
  return null;
}

export default AuthOptimizations;
