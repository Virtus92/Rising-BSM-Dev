/**
 * Database client exports
 * This file provides a consistent way to access the database throughout the application
 */

import { prisma, getPrismaClient } from './common/database/prisma';

// Export the prisma client instance as 'db' for easier imports
export const db = prisma;

// Re-export getPrismaClient for cases where a function is needed
export { getPrismaClient };

// Default export for easier imports
export default prisma;
