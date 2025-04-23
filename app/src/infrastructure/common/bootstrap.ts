/**
 * Environment-aware bootstrap router
 * This file detects the current environment and routes to the appropriate bootstrap implementation
 */

// Re-export common functions from server bootstrap
export { getLogger } from './logging/index';
export { getErrorHandler, getValidationService } from './bootstrap.server';

/**
 * Initializes application services based on the current environment
 * 
 * @returns Promise resolved after initialization
 */
export async function bootstrap(): Promise<void> {
  try {
    // More robust environment detection using explicit checks
    const hasWindow = typeof window !== 'undefined';
    const isNextEdge = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
    const isServer = !hasWindow && !isNextEdge && typeof process !== 'undefined';
    
    if (isServer) {
      // Server environment - use server bootstrap
      // Wrap in try-catch to avoid hard crashes on environment mismatch
      try {
        const { bootstrapServer } = await import('./bootstrap.server');
        console.log('Running server bootstrap');
        return await bootstrapServer();
      } catch (serverError) {
        console.warn('Server bootstrap failed, likely environment mismatch:', serverError);
        // Don't rethrow - allow for graceful degradation
        return;
      }
    } else if (hasWindow) {
      // Client environment - use client bootstrap
      try {
        const { bootstrapClient } = await import('./bootstrap.client');
        console.log('Running client bootstrap');
        return await bootstrapClient();
      } catch (clientError) {
        console.warn('Client bootstrap failed:', clientError);
        // Don't crash the application on bootstrap failure
        return;
      }
    } else if (isNextEdge) {
      // Edge Runtime environment - don't use PrismaClient or other Node.js features
      console.log('Detected Edge Runtime environment, using minimal bootstrap');
      return;
    } else {
      console.warn('Unknown environment detected, skipping bootstrap');
      return;
    }
  } catch (error) {
    console.error('Bootstrap router failed', error);
    // Log but don't crash - enable graceful degradation
    return;
  }
}

/**
 * Resets all singleton instances (mainly for testing)
 * Routes to the appropriate reset function based on environment
 */
export async function resetServices(): Promise<void> {
  const isServer = typeof window === 'undefined' && !process.env.NEXT_RUNTIME;
  const isClient = typeof window !== 'undefined';
  
  if (isServer) {
    const { resetServices } = await import('./bootstrap.server');
    resetServices();
  } else if (isClient) {
    const { resetClientServices } = await import('./bootstrap.client');
    resetClientServices();
  }
}

