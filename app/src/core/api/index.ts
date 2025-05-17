/**
 * Core API module exports
 * This file contains client-safe exports that won't import server-only code
 */

// Export the API client (client-safe)
export * from './ApiClient';

/* Set up token refresh using AuthService when in browser environment
if (typeof window !== 'undefined') {
  import('@/features/auth/core')
    .then(({ AuthService }) => {
      console.log('AuthService loaded for token refresh');
      // Schedule token refresh check
      AuthService.initialize();
    })
    .catch(err => console.error('Failed to initialize AuthService for token refresh:', err));
}*/

// Client-safe route handler types (without implementations)
// These are safe to use in client components
export type {
  RouteHandlerOptions,
  AuthInfo,
  RouteHandler
} from './types.ts';

// Export middleware utilities that are client-safe
export * from './middleware';

// Export types from server for better developer experience
// These are just type definitions, not actual implementations
export type { RouteHandler as ServerRouteHandler } from './types.ts';
export type { RouteHandlerOptions as ServerRouteHandlerOptions } from './types.ts';
export type { AuthInfo as ServerAuthInfo } from './types.ts';

// Note: Server-only components should import from @/core/api/server directly
