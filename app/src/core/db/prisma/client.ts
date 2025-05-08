import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

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
const createPrismaClient = async (): Promise<PrismaClient> => {
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
      console.log('Attempting to regenerate Prisma client...');
      
      // Get the project root directory
      const projectDir = path.resolve(process.cwd());
      console.log('Project directory:', projectDir);
      
      // Check if prisma schema exists
      const schemaPath = path.join(projectDir, 'prisma', 'schema.prisma');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Prisma schema not found at ${schemaPath}`);
      }
      console.log('Found Prisma schema at:', schemaPath);
      
      // Create a promise-based exec function
      const execPromise = (cmd: string) => new Promise<string>((resolve, reject) => {
        exec(cmd, { cwd: projectDir }, (error, stdout, stderr) => {
          if (error) {
            console.error(`Exec error: ${error.message}`);
            return reject(error);
          }
          if (stderr) {
            console.log(`Command stderr: ${stderr}`);
          }
          resolve(stdout);
        });
      });
      
      // Execute prisma generate
      console.log('Executing npx prisma generate...');
      const output = await execPromise('npx prisma generate');
      console.log('Prisma generate output:', output);
      console.log('Prisma client regenerated successfully');
      
      // Clear module cache for @prisma/client
      Object.keys(require.cache).forEach(key => {
        if (key.includes('@prisma/client')) {
          delete require.cache[key];
        }
      });
      
      // Re-require PrismaClient
      console.log('Re-requiring PrismaClient...');
      const { PrismaClient: RegeneratedPrismaClient } = require('@prisma/client');
      
      // Create new instance with logging
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
  // Use global instance if available or initialize async
  if (global.prisma) {
    prismaInstance = global.prisma;
  } else {
    // For async initialization, we need to create a placeholder that will be populated later
    prismaInstance = new PrismaClient();
    
    // Immediately start the initialization process
    createPrismaClient()
      .then(client => {
        // Replace the placeholder with the real client
        Object.assign(prismaInstance, client);
        
        // Save the instance in the global object in development
        if (process.env.NODE_ENV !== 'production') {
          global.prisma = prismaInstance;
        }
        
        console.log('Prisma Client initialized successfully');
      })
      .catch(error => {
        console.error('Failed to initialize Prisma client:', error);
      });
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
