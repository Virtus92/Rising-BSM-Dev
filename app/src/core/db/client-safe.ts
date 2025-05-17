/**
 * Client-Safe Database Exports
 * 
 * This file provides safe alternatives to database functionality
 * for client components without exposing Prisma or direct database access.
 * 
 * IMPORTANT: This is the file that should be imported in client components,
 * NOT the regular db/index.ts which contains server-only code.
 */

// Re-export client utilities
export * from './client';

// Export a strongly-typed function for checking if we're on the server
export const isServerEnvironment = () => typeof window === 'undefined';

/**
 * Helper class for creating database-like client API
 */
export class ClientDataManager<T> {
  private endpoints: {
    getAll: string;
    getById: string;
    create: string;
    update: string;
    delete: string;
  };

  constructor(apiBasePath: string) {
    this.endpoints = {
      getAll: `/api/${apiBasePath}`,
      getById: `/api/${apiBasePath}/`,
      create: `/api/${apiBasePath}`,
      update: `/api/${apiBasePath}/`,
      delete: `/api/${apiBasePath}/`,
    };
  }

  /**
   * Get all records from the API
   */
  async findMany(options?: any): Promise<T[]> {
    try {
      const params = new URLSearchParams();
      
      if (options?.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          params.append(`filter[${key}]`, String(value));
        });
      }
      
      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0];
        params.append('sort', String(field));
        params.append('order', String(direction));
      }
      
      if (options?.skip) {
        const page = Math.floor(options.skip / (options.take || 10)) + 1;
        params.append('page', String(page));
      }
      
      if (options?.take) {
        params.append('limit', String(options.take));
      }

      const response = await fetch(`${this.endpoints.getAll}?${params.toString()}`);
      const data = await response.json();
      
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  }

  /**
   * Find a record by ID
   */
  async findUnique(options: { where: { id: number } }): Promise<T | null> {
    try {
      const response = await fetch(`${this.endpoints.getById}${options.where.id}`);
      const data = await response.json();
      
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching data by ID:', error);
      return null;
    }
  }

  /**
   * Create a new record
   */
  async create(options: { data: Partial<T> }): Promise<T | null> {
    try {
      const response = await fetch(this.endpoints.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options.data)
      });
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error creating data:', error);
      return null;
    }
  }

  /**
   * Update a record
   */
  async update(options: { where: { id: number }, data: Partial<T> }): Promise<T | null> {
    try {
      const response = await fetch(`${this.endpoints.update}${options.where.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options.data)
      });
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error updating data:', error);
      return null;
    }
  }

  /**
   * Delete a record
   */
  async delete(options: { where: { id: number } }): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoints.delete}${options.where.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting data:', error);
      return false;
    }
  }

  /**
   * Count records
   */
  async count(options?: any): Promise<number> {
    try {
      const params = new URLSearchParams();
      
      if (options?.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          params.append(`filter[${key}]`, String(value));
        });
      }
      
      params.append('countOnly', 'true');
      
      const response = await fetch(`${this.endpoints.getAll}?${params.toString()}`);
      const data = await response.json();
      
      return data.success && data.meta ? data.meta.total : 0;
    } catch (error) {
      console.error('Error counting data:', error);
      return 0;
    }
  }
}

/**
 * Creates a client-safe API-based database client 
 * This is a Prisma-like interface that uses API calls instead of direct DB access
 */
export function createClientDb() {
  return {
    user: new ClientDataManager<any>('users'),
    customer: new ClientDataManager<any>('customers'),
    permission: new ClientDataManager<any>('permissions'),
    request: new ClientDataManager<any>('requests'),
    appointment: new ClientDataManager<any>('appointments'),
    notification: new ClientDataManager<any>('notifications'),
  };
}

// Export a client-safe "db" instance
export const clientDb = createClientDb();
