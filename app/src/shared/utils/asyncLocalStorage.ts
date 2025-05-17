import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage for maintaining context across async operations
 * 
 * This utility enables sharing context data within a single request lifecycle,
 * helping manage user information, tokens, and other request-specific state.
 */

// Create a singleton instance of AsyncLocalStorage with a generic context type
const asyncLocalStorage = new AsyncLocalStorage<Record<string, any>>();

/**
 * Get the AsyncLocalStorage instance
 * @returns The AsyncLocalStorage instance
 */
export function getAsyncLocalStorage() {
  return asyncLocalStorage;
}

/**
 * Execute a function within a new async context
 * @param store The store to associate with the context
 * @param fn The function to execute in the context
 * @param args Arguments to pass to the function
 * @returns The result of the function
 */
export function runWithContext<T>(
  store: Record<string, any>,
  fn: (...args: any[]) => T | Promise<T>,
  ...args: any[]
): T | Promise<T> {
  return asyncLocalStorage.run(store, fn, ...args);
}

/**
 * Get the current store from the AsyncLocalStorage
 * @returns The current store or null if not in a context
 */
export function getStore(): Record<string, any> | null {
  return asyncLocalStorage.getStore() || null;
}

/**
 * Set a value in the current store
 * @param key The key to set
 * @param value The value to set
 * @returns True if the value was set, false if not in a context
 */
export function setValue(key: string, value: any): boolean {
  const store = asyncLocalStorage.getStore();
  
  if (!store) {
    return false;
  }
  
  store[key] = value;
  return true;
}

/**
 * Get a value from the current store
 * @param key The key to get
 * @returns The value or undefined if not found or not in a context
 */
export function getValue(key: string): any {
  const store = asyncLocalStorage.getStore();
  
  if (!store) {
    return undefined;
  }
  
  return store[key];
}

/**
 * Helper to get userId from the current context
 * @returns The userId or null if not found
 */
export function getUserId(): number | null {
  const userId = getValue('userId');
  
  if (typeof userId === 'number') {
    return userId;
  }
  
  if (typeof userId === 'string') {
    const parsed = parseInt(userId, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return null;
}
