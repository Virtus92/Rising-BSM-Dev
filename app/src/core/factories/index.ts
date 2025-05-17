/**
 * Central export file for factory functions
 * 
 * This re-exports both client and server factories based on context.
 * The appropriate implementation will be selected automatically based on
 * where this module is imported.
 */

// Import and re-export from client factory implementation
export * from './databaseFactory.client';
export * from './repositoryFactory.client';

// IMPORTANT: Direct imports to serviceFactory should NOT be used, as they will
// cause errors in server contexts. Instead, import from either:
// - './serviceFactory' for client contexts
// - './serviceFactory.server' for server contexts

// Named exports for convenience and backwards compatibility
export { getDatabaseFactory, DatabaseFactory } from './databaseFactory.client';
export { getRepositoryFactory, RepositoryFactory } from './repositoryFactory.client';

// Do NOT export serviceFactory here as it will cause server/client conflicts
// Use direct imports instead:
// import { getServiceFactory } from '@/core/factories/serviceFactory';
// import { getServiceFactory } from '@/core/factories/serviceFactory.server';
