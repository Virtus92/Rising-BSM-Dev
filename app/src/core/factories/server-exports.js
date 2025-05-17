/**
 * Server-side exports for factory functions
 * 
 * This file is imported by index.ts in server contexts.
 * It provides server-specific implementations of factory functions.
 */

// Server-specific imports
const { getDatabaseFactory, DatabaseFactory } = require('./databaseFactory.server');
const { getRepositoryFactory, RepositoryFactory } = require('./repositoryFactory.server');
const { getServiceFactory, ServiceFactory } = require('./serviceFactory.server');

// Export server-specific factory functions
exports.getDatabaseFactory = getDatabaseFactory;
exports.DatabaseFactory = DatabaseFactory;
exports.getRepositoryFactory = getRepositoryFactory;
exports.RepositoryFactory = RepositoryFactory;
exports.getServiceFactory = getServiceFactory;
exports.ServiceFactory = ServiceFactory;

// Re-export everything from server modules
Object.assign(exports, require('./databaseFactory.server'));
Object.assign(exports, require('./repositoryFactory.server'));
Object.assign(exports, require('./serviceFactory.server'));