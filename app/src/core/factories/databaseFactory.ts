/**
 * Factory for database functionality
 */
import { PrismaClient } from '@prisma/client';
import { prisma as prismaInstance } from '@/core/db/prisma';

/**
 * The shared Prisma client instance for the entire application
 */
let prismaClient: PrismaClient = prismaInstance;

/**
 * Returns a singleton instance of PrismaClient
 */
export function getPrismaClient(): PrismaClient {
  return prismaClient;
}

/**
 * Resets the Prisma instance (mainly for testing)
 */
export function resetPrismaClient(): void {
  if (prismaClient) {
    prismaClient.$disconnect();
  }
  prismaClient = prismaInstance;
  DatabaseFactory.instance = undefined;
}

/**
 * Database Factory class for centralized database access
 */
export class DatabaseFactory {
  static instance: DatabaseFactory | undefined = undefined;

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
   * Returns a Prisma client instance
   */
  public getPrismaClient(): PrismaClient {
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
