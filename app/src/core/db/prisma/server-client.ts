// Flag this file as server-only to prevent it from being imported in client code
import 'server-only'; // This protects database credentials from exposure
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton for server-side only
 * 
 * This file provides a singleton instance of PrismaClient that is only used in a server context.
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Track failed connection attempts
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Create and configure PrismaClient with connection retry logic
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres.qkhermeufcstwtlyttpo:postgres@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?schema=public&connection_limit=5&pool_timeout=10'
        },
      },
    });
  } catch (error) {
    connectionAttempts++;
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.warn(`Prisma connection attempt ${connectionAttempts} failed, retrying...`);
      return createPrismaClient();
    } else {
      console.error('Failed to connect to database after multiple attempts:', error);
      throw new Error('Database connection failed after multiple attempts. Check your database configuration.');
    }
  }
};

// Use the global instance or create a new one
export const prisma = global.prisma || createPrismaClient();

// In development, save the instance in the global object
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Returns the singleton instance of PrismaClient
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}
