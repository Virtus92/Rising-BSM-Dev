import { PrismaClient } from '@prisma/client';

// Globale Deklaration für Entwicklungsmodus-Persistenz
declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma-Client mit Logging im Entwicklungsmodus
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Verhindern mehrfacher Instanzen im Entwicklungsmodus
if (process.env.NODE_ENV === 'development') global.prisma = prisma;
