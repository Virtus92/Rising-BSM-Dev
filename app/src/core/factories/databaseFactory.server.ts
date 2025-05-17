// Flag this file as server-only to prevent it from being imported in client code
import 'server-only';
import { PrismaClient } from '@prisma/client';
import { prisma as prismaInstance } from '@/core/db/prisma/server-client';

// Singleton instance for Prisma
let prismaClient: PrismaClient | null = null;

/**
 * Returns a singleton instance of PrismaClient
 * Only available in server context
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
  prismaClient = null;
}
