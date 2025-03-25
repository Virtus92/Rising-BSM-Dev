import { ILoggingService } from '../interfaces/ILoggingService.js';

/**
 * Type for dependency factory functions
 */
type Factory<T> = (container: DiContainer) => T;

/**
 * Type for dependency registration options
 */
interface RegistrationOptions {
  /**
   * Whether the dependency should be a singleton
   */
  singleton?: boolean;
  
  /**
   * Whether to override an existing registration
   */
  override?: boolean;
}

/**
 * DiContainer
 * 
 * Dependency Injection Container that manages application services.
 * Provides a central location for registering and resolving dependencies.
 */
export class DiContainer {
  private static instance: DiContainer;
  private readonly factories = new Map<string, Factory<any>>();
  private readonly singletons = new Map<string, any>();
  private readonly logger?: ILoggingService;

  /**
   * Creates a new DiContainer instance
   * 
   * @param logger - Optional logging service
   */
  private constructor(logger?: ILoggingService) {
    this.logger = logger;
  }
  
  /**
   * Get the singleton instance of DiContainer
   * 
   * @param logger - Optional logging service
   * @returns DiContainer instance
   */
  public static getInstance(logger?: ILoggingService): DiContainer {
    if (!DiContainer.instance) {
      DiContainer.instance = new DiContainer(logger);
    }
    return DiContainer.instance;
  }

  /**
   * Register a dependency
   * 
   * @param token - Dependency token (name or symbol)
   * @param factory - Factory function to create the dependency
   * @param options - Registration options
   * @throws Error if dependency is already registered and override is false
   */
  public register<T>(
    token: string | symbol, 
    factory: Factory<T>, 
    options: RegistrationOptions = {}
  ): void {
    const tokenStr = token.toString();
    
    // Check if already registered
    if (!options.override && this.factories.has(tokenStr)) {
      throw new Error(`Dependency '${tokenStr}' is already registered`);
    }
    
    this.factories.set(tokenStr, factory);
    
    // Clear singleton instance if re-registering
    if (options.override && this.singletons.has(tokenStr)) {
      this.singletons.delete(tokenStr);
    }
    
    this.logger?.debug(`Registered dependency: ${tokenStr}${options.singleton ? ' (singleton)' : ''}`);
  }

  /**
   * Resolve a dependency
   * 
   * @param token - Dependency token (name or symbol)
   * @returns Resolved dependency
   * @throws Error if dependency is not registered
   */
  public resolve<T>(token: string | symbol): T {
    const tokenStr = token.toString();
    
    // Check if registered
    const factory = this.factories.get(tokenStr);
    if (!factory) {
      throw new Error(`Dependency '${tokenStr}' is not registered`);
    }
    
    // Check if singleton instance exists
    if (this.singletons.has(tokenStr)) {
      return this.singletons.get(tokenStr);
    }
    
    // Create instance
    const instance = factory(this);
    
    // Store singleton instance if needed
    if (this.isSingleton(tokenStr)) {
      this.singletons.set(tokenStr, instance);
    }
    
    return instance;
  }

  /**
   * Check if a dependency is registered
   * 
   * @param token - Dependency token (name or symbol)
   * @returns Whether the dependency is registered
   */
  public isRegistered(token: string | symbol): boolean {
    return this.factories.has(token.toString());
  }

  /**
   * Check if a dependency is registered as a singleton
   * 
   * @param token - Dependency token (name or symbol)
   * @returns Whether the dependency is a singleton
   */
  private isSingleton(token: string): boolean {
    // For simplicity, all dependencies are singletons in this implementation
    // In a real implementation, you might want to store this information when registering
    return true;
  }

  /**
   * Clear all registrations
   */
  public clear(): void {
    this.factories.clear();
    this.singletons.clear();
    this.logger?.debug('Cleared all dependencies');
  }
}

/**
 * Create typed factory function
 * 
 * @param ctor - Constructor function
 * @param deps - Dependency tokens
 * @returns Factory function
 */
export function createFactory<T>(
  ctor: new (...args: any[]) => T, 
  deps: (string | symbol)[] = []
): Factory<T> {
  return (container: DiContainer) => {
    const resolvedDeps = deps.map(dep => container.resolve(dep));
    return new ctor(...resolvedDeps);
  };
}

/**
 * DiContainer singleton instance
 */
const container = DiContainer.getInstance();

export default container;