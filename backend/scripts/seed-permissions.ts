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
 * Generate the Permission and Role tables if missing
 * 
 * @param prisma - Prisma client
 */
async function ensureTablesExist(prisma: PrismaClient) {
  try {
    // Check if Permission table exists, if not create it
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Permission" LIMIT 1`;
      console.log("Permission table exists");
    } catch (e) {
      console.log("Creating Permission table");
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Permission" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) UNIQUE NOT NULL,
          "description" TEXT,
          "category" VARCHAR(50) NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }

    // Check if Role table exists, if not create it
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Role" LIMIT 1`;
      console.log("Role table exists");
    } catch (e) {
      console.log("Creating Role table");
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Role" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(50) UNIQUE NOT NULL,
          "description" TEXT,
          "isSystem" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdBy" INTEGER,
          "updatedBy" INTEGER
        )
      `;
    }

    // Check if RolePermission table exists, if not create it
    try {
      await prisma.$queryRaw`SELECT 1 FROM "RolePermission" LIMIT 1`;
      console.log("RolePermission table exists");
    } catch (e) {
      console.log("Creating RolePermission table");
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "RolePermission" (
          "id" SERIAL PRIMARY KEY,
          "roleId" INTEGER NOT NULL,
          "permissionId" INTEGER NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("roleId", "permissionId")
        )
      `;
    }
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
    throw error;
  }
}

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
    // Ensure required tables exist
    await ensureTablesExist(prisma);
    
    // Setup repositories
    const permissionRepository = new PermissionRepository(prisma, logger, errorHandler);
    const roleRepository = new RoleRepository(prisma, logger, errorHandler);
    
    // Create seeder with the correct order of parameters
    const permissionSeed = new PermissionSeed(
      permissionRepository,
      roleRepository,
      logger
    );
    
    // Seed permissions and roles
    await permissionSeed.seed();
    
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