/**
 * Factory für Datenbankfunktionalität
 */
import { PrismaClient } from '@prisma/client';
import { prisma as prismaInstance } from '@/infrastructure/common/database/prisma';

// Singleton-Instanz für Prisma
let prismaClient: PrismaClient;

/**
 * Gibt eine Singleton-Instanz des PrismaClient zurück
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = prismaInstance;
  }
  return prismaClient;
}

/**
 * Setzt die Prisma-Instanz zurück (hauptsächlich für Tests)
 */
export function resetPrismaClient(): void {
  prismaClient = undefined as any;
}
