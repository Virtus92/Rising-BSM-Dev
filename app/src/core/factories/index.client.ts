/**
 * Core factory exports for client components
 * 
 * This barrel file provides a centralized export point for client-safe factory functions.
 * It should be imported only in client components.
 */

'use client';

// Import and re-export all client-side factory functions
export * from './databaseFactory.client';
export * from './repositoryFactory.client';
export * from './serviceFactory';

// Named exports for backwards compatibility
export { getDatabaseFactory, DatabaseFactory } from './databaseFactory.client';
export { getRepositoryFactory, RepositoryFactory } from './repositoryFactory.client';
export { getServiceFactory, ServiceFactory } from './serviceFactory';
