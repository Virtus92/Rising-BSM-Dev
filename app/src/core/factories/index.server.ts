/**
 * Core factory exports for server components
 * 
 * This barrel file provides a centralized export point for server-side factory functions.
 * It should be imported only in server components.
 */

// Import and re-export all server-side factory functions
export * from './databaseFactory.server';
export * from './repositoryFactory.server';
export * from './serviceFactory.server';
import { PrismaClient } from '@prisma/client'; 

// Named exports for backwards compatibility
export { getPrismaClient, resetPrismaClient } from './databaseFactory.server';

// Create and export the DatabaseFactory class for compatibility
export class DatabaseFactory {
  static instance: DatabaseFactory;

  private constructor() {}

  /**
   * Returns the singleton instance of DatabaseFactory
   */
  public static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  /**
   * Returns a Prisma client instance for server-side use
   */
  public getPrismaClient(): PrismaClient {
    return this.getPrismaClient();
  }

  /**
   * Resets the database connections
   */
  public resetPrismaClient(): void {
    this.resetPrismaClient();
  }
}

/**
 * Returns a singleton instance of the DatabaseFactory
 */
export function getDatabaseFactory(): DatabaseFactory {
  return DatabaseFactory.getInstance();
}
export { getRepositoryFactory, RepositoryFactory } from './repositoryFactory.server';
export { 
  getServiceFactory, 
  ServiceFactory,
  getPluginService,
  getPluginLicenseService,
  getPluginInstallationService
} from './serviceFactory.server';
