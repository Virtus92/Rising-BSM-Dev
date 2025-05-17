/**
 * Safe client-side database adapter
 * 
 * This file provides safe APIs for client components that need
 * to access data without directly using Prisma, which is a
 * server-side ORM that cannot be used in the browser.
 * 
 * NEVER import Prisma or actual DB clients in this file!
 */

// Export useful utilities for client components
export const isServerSide = () => typeof window === 'undefined';

/**
 * Error for when client code tries to access server-side databases directly
 */
export class ClientDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientDatabaseError';
  }
}

/**
 * Creates a typed API client for fetching data
 * This is a safe alternative to direct database access for client components
 */
export function createApiDataClient<T>(apiPath: string) {
  return {
    /**
     * Gets a list of items from the API
     */
    getList: async (params?: Record<string, any>): Promise<T[]> => {
      try {
        const url = new URL(`${window.location.origin}/api/${apiPath}`);
        
        // Add query parameters if provided
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.append(key, String(value));
            }
          });
        }
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.success ? data.data : [];
      } catch (error) {
        console.error(`Error fetching ${apiPath}:`, error);
        return [];
      }
    },
    
    /**
     * Gets a single item by ID from the API
     */
    getById: async (id: number | string): Promise<T | null> => {
      try {
        const response = await fetch(`/api/${apiPath}/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.success ? data.data : null;
      } catch (error) {
        console.error(`Error fetching ${apiPath}/${id}:`, error);
        return null;
      }
    },
    
    /**
     * Creates a new item via the API
     */
    create: async (item: Partial<T>): Promise<T | null> => {
      try {
        const response = await fetch(`/api/${apiPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item)
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.success ? data.data : null;
      } catch (error) {
        console.error(`Error creating ${apiPath}:`, error);
        return null;
      }
    },
    
    /**
     * Updates an item via the API
     */
    update: async (id: number | string, item: Partial<T>): Promise<T | null> => {
      try {
        const response = await fetch(`/api/${apiPath}/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item)
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.success ? data.data : null;
      } catch (error) {
        console.error(`Error updating ${apiPath}/${id}:`, error);
        return null;
      }
    },
    
    /**
     * Deletes an item via the API
     */
    delete: async (id: number | string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/${apiPath}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.success;
      } catch (error) {
        console.error(`Error deleting ${apiPath}/${id}:`, error);
        return false;
      }
    }
  };
}

/**
 * Error thrown when code tries to use database in client
 */
export function getDatabaseClient() {
  throw new ClientDatabaseError(
    'Direct database access is not allowed in client components. ' +
    'Use the API client or server components instead.'
  );
}
