/**
 * Environment-aware bootstrap router
 * This file detects the current environment and routes to the appropriate bootstrap implementation
 */

// Re-export common functions from server bootstrap
export { getLogger } from '../logging';
export { getErrorHandler, getValidationService } from './bootstrap.server';

/**
 * Initializes application services based on the current environment
 * 
 * @returns Promise resolved after initialization
 */
export async function bootstrap(): Promise<void> {
  try {
    // Simplified and more reliable environment detection
    // 1. First check for server-only marker - the most reliable method
    const isServerOnlyModule = typeof require !== 'undefined' && require?.main?.path?.includes('node_modules/next');
    
    // 2. Then check for window which definitively indicates client
    const hasWindow = typeof window !== 'undefined';
    
    // 3. Check for Next.js Edge runtime
    const isNextEdge = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
    
    // Determine environment using the checks above
    const isServer = isServerOnlyModule || (!hasWindow && !isNextEdge);
    const isClient = hasWindow;
    
    if (isServer) {
      // Server environment - use server bootstrap
      // Use dynamic import to avoid server-only module errors
      try {
        // Import without using await to improve error handling
        const serverModule = await import('./bootstrap.server');
        console.log('Running server bootstrap');
        return await serverModule.bootstrapServer();
      } catch (serverError) {
        console.warn('Server bootstrap failed:', serverError);
        // Don't rethrow - allow for graceful degradation
        return;
      }
    } else if (isClient) {
      // Client environment - use client bootstrap
      try {
        const clientModule = await import('./bootstrap.client');
        console.log('Running client bootstrap');
        return await clientModule.bootstrapClient();
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
      console.warn('Unknown environment detected, skipping bootstrap (this may be an RSC environment)');
      return;
    }
  } catch (error) {
    console.error('Bootstrap router failed', error as Error);
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
