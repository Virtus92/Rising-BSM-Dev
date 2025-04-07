import { PrismaClient } from '@prisma/client';

// PrismaClient ist in den Produktionsbuild eingebettet.
// PrismaClient wird im Entwicklungsmodus bei webpack-hmr-Updates mehrmals initialisiert.
// Um globale Singleton-Instanz zu bewahren für NextJS-Entwicklungsmodus
// Siehe: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
