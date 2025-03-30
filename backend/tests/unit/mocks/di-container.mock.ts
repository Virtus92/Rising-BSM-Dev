import { DiContainer } from '../../../src/core/DiContainer.js';

/**
 * Mock implementation of DiContainer for testing
 */
export class MockDiContainer {
  private dependencies: Map<string, any> = new Map();
  
  /**
   * Register a dependency in the mock container
   */
  register<T>(
    token: string | symbol, 
    factory: (container: DiContainer) => T, 
    options: { singleton?: boolean, override?: boolean } = {}
  ): void {
    const tokenStr = token.toString();
    
    if (!options.override && this.dependencies.has(tokenStr)) {
      throw new Error(`Dependency '${tokenStr}' is already registered`);
    }
    
    // In the mock, we immediately execute the factory function
    const instance = factory(this as unknown as DiContainer);
    this.dependencies.set(tokenStr, instance);
  }
  
  /**
   * Resolve a dependency from the mock container
   */
  resolve<T>(token: string | symbol): T {
    const tokenStr = token.toString();
    
    if (!this.dependencies.has(tokenStr)) {
      throw new Error(`Dependency '${tokenStr}' is not registered`);
    }
    
    return this.dependencies.get(tokenStr) as T;
  }
  
  /**
   * Check if a dependency is registered
   */
  isRegistered(token: string | symbol): boolean {
    return this.dependencies.has(token.toString());
  }
  
  /**
   * Clear all registered dependencies
   */
  clear(): void {
    this.dependencies.clear();
  }
  
  /**
   * Manually set a dependency (for testing purposes)
   */
  set<T>(token: string | symbol, instance: T): void {
    this.dependencies.set(token.toString(), instance);
  }
}

/**
 * Factory to create a mock container instance
 */
export function createMockDiContainer(): MockDiContainer {
  return new MockDiContainer();
}
