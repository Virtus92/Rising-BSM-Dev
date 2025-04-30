/**
 * Authentication Middleware Exports
 * Provides a clean public API for auth middleware
 */

// Export everything from authMiddleware
export * from './authMiddleware';

// Export default for convenience
export { default } from './authMiddleware';

// Export auth middleware function directly
export { authMiddleware as apiAuth } from './authMiddleware';
