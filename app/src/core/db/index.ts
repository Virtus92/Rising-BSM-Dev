// Re-export all database modules
export * from './prisma';

// Convenience export of the primary database client
import { prisma } from './prisma';
export { prisma as db };
