// Re-export all database modules
export * from './prisma';

// Export the database status checker
export * from './database-status';

// Convenience export of the primary database client
import { prisma } from './prisma';
export { prisma as db };
