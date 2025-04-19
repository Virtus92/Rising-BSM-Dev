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
  // Check which environment we're in
  const isServer = typeof window === 'undefined' && !process.env.NEXT_RUNTIME;
  const isClient = typeof window !== 'undefined';
  const isEdgeRuntime = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
  
  try {
    if (isServer) {
      // Server environment - use server bootstrap
      const { bootstrapServer } = await import('./bootstrap.server');
      return bootstrapServer();
    } else if (isClient) {
      // Client environment - use client bootstrap
      const { bootstrapClient } = await import('./bootstrap.client');
      return bootstrapClient();
    } else if (isEdgeRuntime) {
      // Edge Runtime environment - don't use PrismaClient or other Node.js features
      console.log('Skipping full bootstrap in Edge Runtime environment');
      return;
    } else {
      console.warn('Unknown environment detected, skipping bootstrap');
      return;
    }
  } catch (error) {
    console.error('Bootstrap router failed', error);
    throw error;
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

