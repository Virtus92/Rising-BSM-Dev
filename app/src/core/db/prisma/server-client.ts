// Flag this file as server-only to prevent it from being imported in client code
import 'server-only';
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

// Create and configure PrismaClient
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
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
