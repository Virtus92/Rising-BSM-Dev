/**
 * Dependency Container
 * 
 * Simple dependency injection container for managing application services and repositories.
 * Provides a central location for registering and resolving dependencies with proper lifecycle management.
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/common.utils.js';

/**
 * A simplified dependency injection container
 */
class DependencyContainer {
  private static instance: DependencyContainer;
  private container: Map<string, any> = new Map();
  private singletons: Map<string, any> = new Map();

  /**
   * Get the singleton instance of the dependency container
   */
  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Register a dependency factory
   * @param name - Dependency name/key
   * @param factory - Factory function that creates the dependency
   * @param singleton - Whether the dependency should be a singleton
   */
  public register<T>(name: string, factory: () => T, singleton: boolean = false): void {
    this.container.set(name, { factory, singleton });
    logger.debug(`Registered dependency: ${name}${singleton ? ' (singleton)' : ''}`);
  }

  /**
   * Resolve a dependency by name
   * @param name - Dependency name/key
   * @returns Resolved dependency
   * @throws Error if dependency is not registered
   */
  public resolve<T>(name: string): T {
    const dependency = this.container.get(name);
    
    if (!dependency) {
      throw new Error(`Dependency not registered: ${name}`);
    }
    
    if (dependency.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, dependency.factory());
        logger.debug(`Created singleton instance: ${name}`);
      }
      return this.singletons.get(name) as T;
    }
    
    return dependency.factory() as T;
  }

  /**
   * Check if a dependency is registered
   * @param name - Dependency name/key
   * @returns Whether the dependency is registered
   */
  public has(name: string): boolean {
    return this.container.has(name);
  }

  /**
   * Remove a dependency from the container
   * @param name - Dependency name/key
   */
  public remove(name: string): void {
    this.container.delete(name);
    this.singletons.delete(name);
    logger.debug(`Removed dependency: ${name}`);
  }

  /**
   * Clear all dependencies from the container
   */
  public clear(): void {
    this.container.clear();
    this.singletons.clear();
    logger.debug('Cleared all dependencies');
  }
}

// Get container instance
const container = DependencyContainer.getInstance();

// Register core dependencies
container.register<PrismaClient>('PrismaClient', () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
}, true);

/**
 * Helper function to get a registered dependency
 * @param name - Dependency name/key
 * @returns Resolved dependency
 */
export function inject<T>(name: string): T {
  return container.resolve<T>(name);
}

/**
 * Cleanup function to be called on application shutdown
 */
export async function cleanup(): Promise<void> {
  // Close database connection
  const prisma = container.resolve<PrismaClient>('PrismaClient');
  await prisma.$disconnect();
  
  // Clear container
  container.clear();
  
  logger.info('Dependency container cleaned up');
}

export default container;