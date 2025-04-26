/**
 * Core API module exports
 */

// Export the API client
export * from './ApiClient';

// Export route handler utilities - client-safe version
export * from './route-handler';

// Export middleware utilities
export * from './middleware';

// Note: Server-only components should import from @/core/api/server directly
