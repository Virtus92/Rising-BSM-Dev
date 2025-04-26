/**
 * Factory for database functionality
 */
import { PrismaClient } from '@prisma/client';
import { prisma as prismaInstance } from '@/core/db/prisma';

// Singleton instance for Prisma
let prismaClient: PrismaClient;

/**
 * Returns a singleton instance of PrismaClient
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = prismaInstance;
  }
  return prismaClient;
}

/**
 * Resets the Prisma instance (mainly for testing)
 */
export function resetPrismaClient(): void {
  prismaClient = undefined as any;
  DatabaseFactory.instance = undefined as any;
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
