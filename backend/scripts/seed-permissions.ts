#!/usr/bin/env node

/**
 * Permission and Role Seeding Script
 * 
 * This script initializes the system with default permissions and roles.
 * It should be run during initial setup and after any permission schema changes.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { LoggingService } from '../src/core/LoggingService.js';
import { LogLevel } from '../src/interfaces/ILoggingService.js';
import { PermissionRepository } from '../src/repositories/PermissionRepository.js';
import { RoleRepository } from '../src/repositories/RoleRepository.js';
import { PermissionSeed } from '../src/utils/PermissionSeed.js';
import { ErrorHandler } from '../src/core/ErrorHandler.js';

/**
 * Main function to seed permissions and roles
 */
async function main() {
  console.log('Starting permission and role seeding...');
  
  // Setup basic services
  const logger = new LoggingService({ level: LogLevel.DEBUG });
  const errorHandler = new ErrorHandler(logger, true);
  const prisma = new PrismaClient();
  
  try {
    // Setup repositories
    const permissionRepository = new PermissionRepository(prisma, logger, errorHandler);
    const roleRepository = new RoleRepository(prisma, logger, errorHandler);
    
    // Create seeder
    const permissionSeed = new PermissionSeed(permissionRepository, roleRepository, logger);
    
    // Seed permissions
    console.log('Seeding permissions...');
    const permissionResult = await permissionSeed.seedPermissions();
    console.log(`Permission seeding complete: ${permissionResult.created} created, ${permissionResult.existing} already existed`);
    
    // Seed roles
    console.log('Seeding roles...');
    await permissionSeed.seedRoles();
    console.log('Role seeding complete');
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    // Clean up
    await prisma.$disconnect();
  }
}

// Run the main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });