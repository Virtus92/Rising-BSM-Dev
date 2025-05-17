'use client';

/**
 * Client-specific database factory implementation
 * 
 * This implementation provides placeholder functions that do not actually use Prisma,
 * but maintain the same interface for consistent code structure.
 */

export type MockPrismaClient = {
  [key: string]: any;
};

/**
 * Returns a mock PrismaClient that's safe to use in browser environments
 */
export function getPrismaClient(): MockPrismaClient {
  return createMockPrismaClient();
}

/**
 * Creates a mock Prisma client that won't try to connect to a database
 * but maintains the expected interface
 */
function createMockPrismaClient(): MockPrismaClient {
  const mockPrisma: MockPrismaClient = {};
  
  // Add models as proxy objects that log warnings when used
  ['user', 'customer', 'appointment', 'request', 'notification', 'permission', 'activityLog', 'refreshToken'].forEach(model => {
    mockPrisma[model] = createMockPrismaModel(model);
  });
  
  // Add a $connect method that does nothing for compatibility
  mockPrisma.$connect = async () => {
    console.warn('Mock PrismaClient.$connect called from client component');
  };
  
  // Add a $disconnect method that does nothing for compatibility
  mockPrisma.$disconnect = async () => {
    console.warn('Mock PrismaClient.$disconnect called from client component');
  };
  
  return mockPrisma;
}

/**
 * Creates a mock model with methods that prevent actual database operations
 */
function createMockPrismaModel(modelName: string): any {
  return {
    findUnique: async () => {
      console.warn(`Client-side attempted to use ${modelName}.findUnique - Use API calls instead`);
      return null;
    },
    findMany: async () => {
      console.warn(`Client-side attempted to use ${modelName}.findMany - Use API calls instead`);
      return [];
    },
    findFirst: async () => {
      console.warn(`Client-side attempted to use ${modelName}.findFirst - Use API calls instead`);
      return null;
    },
    create: () => {
      throw new Error(`Cannot use ${modelName}.create in browser environment - Use API calls instead`);
    },
    update: () => {
      throw new Error(`Cannot use ${modelName}.update in browser environment - Use API calls instead`);
    },
    delete: () => {
      throw new Error(`Cannot use ${modelName}.delete in browser environment - Use API calls instead`);
    },
    upsert: () => {
      throw new Error(`Cannot use ${modelName}.upsert in browser environment - Use API calls instead`);
    },
    count: async () => {
      console.warn(`Client-side attempted to use ${modelName}.count - Use API calls instead`);
      return 0;
    }
  };
}

/**
 * Resets the mock Prisma instance (mainly for testing)
 */
export function resetPrismaClient(): void {
  // Nothing to reset in client implementation
  console.log('Reset called on mock PrismaClient');
}

/**
 * Database Factory class for centralized database access
 */
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
   * Returns a mock Prisma client instance that's safe for browser use
   */
  public getPrismaClient(): MockPrismaClient {
    return getPrismaClient();
  }

  /**
   * Resets the database connections
   */
  public resetPrismaClient(): void {
    resetPrismaClient();
  }
}

/**
 * Returns a singleton instance of the DatabaseFactory
 */
export function getDatabaseFactory(): DatabaseFactory {
  return DatabaseFactory.getInstance();
}
