import { PrismaClient } from '@prisma/client';

/**
 * Prisma-Client-Singleton für die gesamte Anwendung
 * 
 * Diese Datei stellt eine einheitliche Instanz des PrismaClient bereit.
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Erstelle und konfiguriere den PrismaClient
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Verwende die globale Instanz oder erstelle eine neue
export const prisma = global.prisma || createPrismaClient();

// In der Entwicklung speichern wir die Instanz im globalen Objekt
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Gibt eine Singleton-Instanz des PrismaClient zurück
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}
