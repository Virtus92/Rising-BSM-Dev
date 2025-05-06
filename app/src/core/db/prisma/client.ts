import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * 
 * This file provides a unified singleton instance of PrismaClient with error handling.
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Flag to track initialization attempts to avoid infinite loops
 */
let initializationAttempted = false;

/**
 * Create and configure PrismaClient with proper error handling
 */
const createPrismaClient = () => {
  try {
    // Add validation to ensure Prisma client is actually available
    if (!PrismaClient) {
      throw new Error('PrismaClient constructor is not available');
    }
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    // Avoid infinite recursion
    if (initializationAttempted) {
      console.error('Failed to initialize Prisma client again:', error);
      throw new Error('Prisma client initialization failed repeatedly. Please ensure Prisma is properly installed and generated.');
    }
    
    // Only try auto-fix once
    initializationAttempted = true;
    
    console.error('Error creating Prisma client:', error);
    console.log('Attempting to fix by regenerating Prisma client...');
    
    // This is a last-resort attempt to regenerate the client at runtime
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('Prisma client regenerated successfully');
      
      // Try to clear require cache for @prisma/client
      Object.keys(require.cache).forEach(key => {
        if (key.includes('@prisma/client')) {
          delete require.cache[key];
        }
      });
      
      // Re-require PrismaClient
      const { PrismaClient: RegeneratedPrismaClient } = require('@prisma/client');
      return new RegeneratedPrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    } catch (regenerationError) {
      console.error('Failed to regenerate Prisma client:', regenerationError);
      throw new Error('Could not initialize or regenerate Prisma client. Please run `npx prisma generate` manually.');
    }
  }
};

// Use the global instance or create a new one with error handling
let prismaInstance: PrismaClient;

try {
  prismaInstance = global.prisma || createPrismaClient();
  
  // In development, save the instance in the global object
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prismaInstance;
  }
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  throw new Error('Prisma client initialization failed. Please ensure Prisma is properly installed and generated.');
}

export const prisma = prismaInstance;

/**
 * Returns the singleton instance of PrismaClient
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}
