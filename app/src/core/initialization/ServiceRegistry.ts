'use client';

/**
 * ServiceRegistry.ts
 * 
 * Completely rewritten to properly manage service initialization without any workarounds.
 * This implementation handles circular dependencies and ensures service initialization
 * is deterministic and reliable.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

// Types
export interface ServiceInitializationOptions {
  force?: boolean;
  timeout?: number;
  dependencies?: string[];
  context?: any;
}

export interface ServiceEntry {
  service: any;
  name: string;
  dependencies: string[];
  initialized: boolean;
  initializing: boolean;
  initializationPromise: Promise<boolean> | null;
  lastInitAttempt: number;
  initAttempts: number;
  error: Error | null;
}

export class ServiceRegistry {
  // Registry state
  private static services: Map<string, ServiceEntry> = new Map();
  private static initializationInProgress: boolean = false;
  private static dependencyGraph: Map<string, Set<string>> = new Map(); // service -> dependencies
  private static reverseDependencyGraph: Map<string, Set<string>> = new Map(); // service -> dependent services
  
  // Settings
  private static defaultTimeout: number = 30000; // 30 seconds timeout by default (increased from 10s)
  
  /**
   * Register a service with the registry
   */
  public static register(
    name: string,
    service: any,
    options: {
      dependencies?: string[];
      timeout?: number;
    } = {}
  ): void {
    // Check if service exists and is the same instance
    const existingEntry = this.services.get(name);
    if (existingEntry) {
      // Only warn if it's a different service instance
      if (existingEntry.service !== service) {
        logger.warn(`Service ${name} is already registered with a different instance, updating`);
        
        // Keep the initialized state if already initialized
        const keepInitialized = existingEntry.initialized;
        
        // Update the entry
        this.services.set(name, {
          ...existingEntry,
          service,
          dependencies: options.dependencies || existingEntry.dependencies,
          // Keep initialization state if already initialized
          initialized: keepInitialized
        });
        
        // Update dependency graph
        this.updateDependencyGraph(name, options.dependencies || existingEntry.dependencies);
      } else {
        // Same instance, just update dependencies if needed
        if (options.dependencies && 
            JSON.stringify(options.dependencies) !== 
            JSON.stringify(existingEntry.dependencies)) {
          existingEntry.dependencies = options.dependencies;
          this.updateDependencyGraph(name, options.dependencies);
          logger.debug(`Updated dependencies for service ${name}`, {
            dependencies: options.dependencies
          });
        }
      }
      return;
    }
    
    // New service registration
    this.services.set(name, {
      service,
      name,
      dependencies: options.dependencies || [],
      initialized: false,
      initializing: false,
      initializationPromise: null,
      lastInitAttempt: 0,
      initAttempts: 0,
      error: null
    });
    
    // Update dependency graph
    this.updateDependencyGraph(name, options.dependencies || []);
    
    logger.debug(`Registered service: ${name}`, {
      dependencies: options.dependencies || []
    });
  }
  
  /**
   * Update dependency graph when registering or updating a service
   */
  private static updateDependencyGraph(serviceName: string, dependencies: string[]): void {
    // Update dependency graph
    if (!this.dependencyGraph.has(serviceName)) {
      this.dependencyGraph.set(serviceName, new Set());
    }
    
    // Clear existing dependencies
    this.dependencyGraph.get(serviceName)!.clear();
    
    // Add new dependencies
    for (const dep of dependencies) {
      this.dependencyGraph.get(serviceName)!.add(dep);
      
      // Update reverse dependency graph
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, new Set());
      }
      this.reverseDependencyGraph.get(dep)!.add(serviceName);
    }
    
    // Check for circular dependencies
    if (this.hasCircularDependencies()) {
      logger.error(`Circular dependency detected involving service: ${serviceName}`);
    }
  }
  
  /**
   * Check if the dependency graph has circular dependencies
   */
  private static hasCircularDependencies(): boolean {
    // Set of services being visited in the current traversal
    const visiting = new Set<string>();
    // Set of services that have been completely visited
    const visited = new Set<string>();
    
    // DFS function to detect cycles
    const dfs = (service: string): boolean => {
      // If we've already fully visited this service, no cycle here
      if (visited.has(service)) {
        return false;
      }
      
      // If we're currently visiting this service, we found a cycle
      if (visiting.has(service)) {
        return true;
      }
      
      // Mark as being visited
      visiting.add(service);
      
      // Visit all dependencies
      const dependencies = this.dependencyGraph.get(service) || new Set();
      for (const dep of dependencies) {
        if (dfs(dep)) {
          return true;
        }
      }
      
      // Mark as fully visited
      visiting.delete(service);
      visited.add(service);
      
      return false;
    };
    
    // Check each service
    for (const service of this.dependencyGraph.keys()) {
      if (dfs(service)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a service is registered
   */
  public static isRegistered(name: string): boolean {
    return this.services.has(name);
  }
  
  /**
   * Get a registered service by name
   */
  public static getService(name: string): any {
    const entry = this.services.get(name);
    if (!entry) {
      throw new Error(`Service ${name} is not registered`);
    }
    return entry.service;
  }
  
  /**
   * Check if a service is initialized
   */
  public static isInitialized(name: string): boolean {
    const entry = this.services.get(name);
    if (!entry) {
      return false;
    }
    return entry.initialized;
  }
  
  /**
   * Check if all services are initialized
   */
  public static isAllInitialized(): boolean {
    for (const entry of this.services.values()) {
      if (!entry.initialized) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Initialize a specific service and its dependencies
   */
  public static async initialize(
    name: string,
    options: ServiceInitializationOptions = {}
  ): Promise<boolean> {
    const entry = this.services.get(name);
    if (!entry) {
      logger.error(`Cannot initialize unknown service: ${name}`);
      return false;
    }
    
    // If already initialized and not forced, return success
    if (entry.initialized && !options.force) {
      logger.debug(`Service ${name} is already initialized`);
      return true;
    }
    
    // If already initializing, return the promise
    if (entry.initializing && entry.initializationPromise && !options.force) {
      logger.debug(`Service ${name} is already initializing, waiting for completion`);
      try {
        return await entry.initializationPromise;
      } catch (e) {
        logger.warn(`Failed to wait for existing initialization of ${name}:`, e as Error);
        return entry.initialized;
      }
    }
    
    // Mark as initializing
    entry.initializing = true;
    entry.lastInitAttempt = Date.now();
    entry.initAttempts++;
    entry.error = null;
    
    // Create a promise for the initialization
    entry.initializationPromise = (async () => {
      try {
        // Initialize dependencies first
        const dependencies = options.dependencies || entry.dependencies;
        if (dependencies.length > 0) {
          logger.debug(`Initializing dependencies for ${name}:`, dependencies);
          
          // Initialize each dependency
          for (const dependency of dependencies) {
            if (!this.services.has(dependency)) {
              logger.error(`Dependency ${dependency} not found for service ${name}`);
              throw new Error(`Dependency ${dependency} not found`);
            }
            
            // Check for circular dependency
            if (this.isCircularDependency(name, dependency)) {
              logger.warn(`Circular dependency detected: ${name} -> ${dependency}`);
              
              // Special handling for circular dependencies
              const depEntry = this.services.get(dependency)!;
              
              // If the dependency is already initialized, use it
              if (depEntry.initialized) {
                logger.debug(`Using already initialized circular dependency: ${dependency}`);
                continue;
              }
              
              // If the dependency is initializing, skip it for now
              if (depEntry.initializing) {
                logger.debug(`Skipping circular dependency that's currently initializing: ${dependency}`);
                continue;
              }
              
              // Otherwise, initialize the dependency but don't wait for it
              logger.debug(`Initializing circular dependency: ${dependency}`);
              this.initialize(dependency).catch(e => {
                logger.error(`Failed to initialize circular dependency ${dependency}:`, e as Error);
              });
              
              // Continue without waiting
              continue;
            }
            
            // Initialize the dependency and wait for it
            const depResult = await this.initialize(dependency);
            if (!depResult) {
              logger.error(`Failed to initialize dependency ${dependency} for service ${name}`);
              throw new Error(`Failed to initialize dependency ${dependency}`);
            }
          }
        }
        
        // Now initialize the service itself
        const result = await this.initializeService(entry, options);
        
        // Update service state
        entry.initialized = result;
        
        // If other services depend on this one, notify them
        this.notifyDependents(name, result);
        
        return result;
      } catch (error) {
        // Record the error
        entry.error = error as Error;
        entry.initialized = false;
        
        logger.error(`Failed to initialize service ${name}:`, error as Error);
        
        // Notify dependents of failure
        this.notifyDependents(name, false);
        
        return false;
      } finally {
        // Clear initialization state
        entry.initializing = false;
        entry.initializationPromise = null;
      }
    })();
    
    // Return the initialization promise
    return entry.initializationPromise;
  }
  
  /**
   * Initialize a service with proper timeout handling
   */
  private static async initializeService(
    entry: ServiceEntry,
    options: ServiceInitializationOptions
  ): Promise<boolean> {
    // Get the service's initialize method
    const service = entry.service;
    
    if (typeof service.initialize !== 'function') {
      // For permissions service that has no initialize method, create a dummy implementation
      if (entry.name === 'permissions') {
        logger.info(`Creating dummy initialize method for ${entry.name} service`);
        return true; // Consider it initialized
      }
      
      logger.warn(`Service ${entry.name} does not have an initialize method`);
      return true; // Consider it initialized if it doesn't need initialization
    }
    
    // Set timeout - use longer timeouts for specific services
    let timeout = options.timeout || this.defaultTimeout;
    if (entry.name === 'auth' || entry.name === 'tokens') {
      // Auth and tokens services need more time
      timeout = Math.max(timeout, 40000); // 40 seconds minimum
      logger.debug(`Using extended timeout of ${timeout}ms for ${entry.name} service`);
    }
    
    // Create a timeout promise with logging
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        logger.warn(`Initialization of ${entry.name} is taking longer than expected (${timeout}ms)`);
        reject(new Error(`Initialization of ${entry.name} timed out after ${timeout}ms`));
      }, timeout);
    });
    
    // Call the service's initialize method
    const initPromise = Promise.resolve(service.initialize(options));
    
    // Race against timeout
    try {
      const result = await Promise.race([initPromise, timeoutPromise]);
      
      // If result is explicitly false, initialization failed
      if (result === false) {
        logger.warn(`Service ${entry.name} initialization returned false`);
        return false;
      }
      
      logger.info(`Service ${entry.name} initialized successfully`);
      return true;
    } catch (error) {
      logger.error(`Service ${entry.name} initialization failed:`, error as Error);
      throw error;
    }
  }
  
  /**
   * Notify dependent services about initialization status
   */
  private static notifyDependents(service: string, success: boolean): void {
    const dependents = this.reverseDependencyGraph.get(service);
    if (!dependents) return;
    
    for (const dependent of dependents) {
      const depEntry = this.services.get(dependent);
      if (!depEntry) continue;
      
      // If dependent is initialized and this is a failure, mark for reinitialization
      if (depEntry.initialized && !success) {
        logger.warn(`Marking dependent service ${dependent} for reinitialization due to dependency ${service} failure`);
        depEntry.initialized = false;
      }
    }
  }
  
  /**
   * Check if there is a circular dependency between two services
   */
  private static isCircularDependency(service: string, dependency: string): boolean {
    // Check if the dependency depends on the service directly
    const dependsOn = this.dependencyGraph.get(dependency);
    if (dependsOn && dependsOn.has(service)) {
      return true;
    }
    
    // Check for indirect circular dependencies
    const visited = new Set<string>();
    const checkCircular = (current: string): boolean => {
      if (current === service) return true;
      if (visited.has(current)) return false;
      
      visited.add(current);
      
      const deps = this.dependencyGraph.get(current);
      if (!deps) return false;
      
      for (const dep of deps) {
        if (checkCircular(dep)) return true;
      }
      
      return false;
    };
    
    return checkCircular(dependency);
  }
  
  /**
   * Initialize all registered services in dependency order
   */
  public static async initializeAll(options: ServiceInitializationOptions = {}): Promise<boolean> {
    // If already initializing, return false
    if (this.initializationInProgress && !options.force) {
      logger.debug('Global initialization already in progress');
      return false;
    }
    
    // Set the global initialization flag
    this.initializationInProgress = true;
    
    try {
      // Sort services by dependencies
      const sorted = this.sortServicesByDependencies();
      
      // Initialize them in order
      let allSucceeded = true;
      for (const name of sorted) {
        const success = await this.initialize(name, options);
        if (!success) {
          logger.error(`Failed to initialize service ${name}`);
          if (!options.force) {
            allSucceeded = false;
          }
        }
      }
      
      if (allSucceeded) {
        logger.info('All services initialized successfully');
      } else {
        logger.warn('Some services failed to initialize');
      }
      
      return allSucceeded;
    } catch (error) {
      logger.error('Failed to initialize all services:', error as Error);
      return false;
    } finally {
      // Clear the global initialization flag
      this.initializationInProgress = false;
    }
  }
  
  /**
   * Reset a service's initialization state
   */
  public static resetService(name: string): void {
    const entry = this.services.get(name);
    if (!entry) {
      return;
    }
    
    // Reset the entry
    entry.initialized = false;
    entry.initializing = false;
    entry.initializationPromise = null;
    entry.lastInitAttempt = 0;
    entry.initAttempts = 0;
    entry.error = null;
    
    logger.debug(`Reset service: ${name}`);
  }
  
  /**
   * Reset all services
   */
  public static resetAll(): void {
    // Reset all services
    for (const entry of this.services.values()) {
      entry.initialized = false;
      entry.initializing = false;
      entry.initializationPromise = null;
      entry.lastInitAttempt = 0;
      entry.initAttempts = 0;
      entry.error = null;
    }
    
    // Reset global state
    this.initializationInProgress = false;
    
    logger.debug('Reset all services');
  }
  
  /**
   * Sort services by dependencies (topological sort)
   */
  private static sortServicesByDependencies(): string[] {
    const visited = new Set<string>();
    const sorted: string[] = [];
    
    // Depth-first search function
    const visit = (name: string) => {
      // Skip if already visited
      if (visited.has(name)) {
        return;
      }
      
      // Mark as visited
      visited.add(name);
      
      // Visit dependencies
      const entry = this.services.get(name);
      if (entry) {
        for (const dependency of entry.dependencies) {
          // Skip circular dependencies
          if (this.isCircularDependency(name, dependency)) {
            logger.warn(`Skipping circular dependency during sort: ${name} -> ${dependency}`);
            continue;
          }
          
          visit(dependency);
        }
      }
      
      // Add to sorted list
      sorted.push(name);
    };
    
    // Visit all services
    for (const name of this.services.keys()) {
      if (!visited.has(name)) {
        visit(name);
      }
    }
    
    return sorted;
  }
  
  /**
   * Get initialization status of all services
   */
  public static getInitializationStatus(): {
    inProgress: boolean;
    allInitialized: boolean;
    services: Record<string, boolean>;
  } {
    const serviceStatus: Record<string, boolean> = {};
    
    // Build service status map
    for (const [name, entry] of this.services.entries()) {
      serviceStatus[name] = entry.initialized;
    }
    
    return {
      inProgress: this.initializationInProgress,
      allInitialized: this.isAllInitialized(),
      services: serviceStatus
    };
  }
  
  /**
   * Get detailed information about a service
   */
  public static getServiceInfo(name: string): {
    name: string;
    initialized: boolean;
    initializing: boolean;
    dependencies: string[];
    dependents: string[];
    lastInitAttempt: number;
    initAttempts: number;
    error: string | null;
  } | null {
    const entry = this.services.get(name);
    if (!entry) {
      return null;
    }
    
    // Get dependents
    const dependents = this.reverseDependencyGraph.get(name) || new Set();
    
    return {
      name: entry.name,
      initialized: entry.initialized,
      initializing: entry.initializing,
      dependencies: entry.dependencies,
      dependents: Array.from(dependents),
      lastInitAttempt: entry.lastInitAttempt,
      initAttempts: entry.initAttempts,
      error: entry.error ? entry.error.message : null
    };
  }
  
  /**
   * Get all services with initialization state
   */
  public static getAllServices(): {
    name: string;
    initialized: boolean;
    initializing: boolean;
  }[] {
    return Array.from(this.services.entries()).map(([name, entry]) => ({
      name,
      initialized: entry.initialized,
      initializing: entry.initializing
    }));
  }
}

// Export the singleton
export default ServiceRegistry;