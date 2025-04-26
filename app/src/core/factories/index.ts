/**
 * Central export file for factory functions
 * 
 * This file exports all factory functions and classes
 * for easy import in other parts of the application.
 */

// Import factory functions first to ensure they're defined
import { getDatabaseFactory, DatabaseFactory } from './databaseFactory';
import { getRepositoryFactory, RepositoryFactory } from './repositoryFactory';
import { getServiceFactory, ServiceFactory } from './serviceFactory';

// Database factory
export * from './databaseFactory';

// Repository factories 
export * from './repositoryFactory';

// Service factories
export * from './serviceFactory';

// Add explicit exports for factory functions and classes
// These are the primary exports used by bootstrap.server.ts
export { getServiceFactory, ServiceFactory };
export { getDatabaseFactory, DatabaseFactory };
export { getRepositoryFactory, RepositoryFactory };
