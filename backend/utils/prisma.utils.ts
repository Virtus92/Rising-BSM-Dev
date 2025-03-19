import { PrismaClient } from '@prisma/client';

// Use a global variable to cache the Prisma instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a new PrismaClient if one doesn't exist, or use the existing one
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// In development, store the instance on the global object to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;