/**
 * Database Utilities for Testing
 * 
 * This file contains utilities for managing test databases.
 */
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Convert exec to promise-based
const execAsync = promisify(exec);

// Database client instances cache
const prismaInstances: Record<string, PrismaClient> = {};

/**
 * Create a test database and run migrations
 * @param uniqueName - Whether to create a unique database name (default: true)
 * @returns Name of the created test database
 */
export async function setupTestDatabase(uniqueName = true): Promise<string> {
  // Generate unique database name if requested
  const testDbName = uniqueName ? `rising_bsm_test_${Date.now()}` : 'rising_bsm_test';
  const connectionString = `postgresql://postgres:postgres@localhost:5432/${testDbName}`;
  
  try {
    // Create test database if it doesn't exist
    await execAsync(`dropdb --if-exists ${testDbName} -U postgres`);
    await execAsync(`createdb ${testDbName} -U postgres`);
    
    // Update connection string
    process.env.DATABASE_URL = connectionString;
    
    // Run migrations
    await execAsync('npx prisma migrate deploy');
    
    console.log(`Test database ${testDbName} created and migrations applied`);
    return testDbName;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

/**
 * Create or get a Prisma client instance
 * @param connectionString - Optional database connection string
 * @returns PrismaClient instance
 */
export function getPrismaClient(connectionString?: string): PrismaClient {
  const url = connectionString || process.env.DATABASE_URL;
  
  if (!url) {
    throw new Error('Database connection string not provided and DATABASE_URL not set');
  }
  
  // Return cached instance if it exists
  if (prismaInstances[url]) {
    return prismaInstances[url];
  }
  
  // Create and cache a new instance
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
  
  prismaInstances[url] = prisma;
  return prisma;
}

/**
 * Cleanup test database after tests
 * @param dbName - Name of the database to clean up
 */
export async function cleanupTestDatabase(dbName: string): Promise<void> {
  try {
    // Disconnect any prisma instances first
    for (const url in prismaInstances) {
      if (url.includes(dbName)) {
        await prismaInstances[url].$disconnect();
        delete prismaInstances[url];
      }
    }
    
    await execAsync(`dropdb --if-exists ${dbName} -U postgres`);
    console.log(`Test database ${dbName} cleaned up`);
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
}

/**
 * Seed the database with test data
 * @param prisma - Prisma client instance
 * @param dataSet - Name of the dataset to use ('minimal' or 'full')
 */
export async function seedTestDatabase(prisma: PrismaClient, dataSet: 'minimal' | 'full' = 'minimal'): Promise<void> {
  console.log(`Seeding database with ${dataSet} dataset...`);
  
  try {
    // Start with creating admin user (needed for most tests)
    const adminUser = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'testadmin@example.com',
        password: await bcrypt.hash('TestAdmin123!', 10),
        role: 'admin',
        status: 'active'
      }
    });
    
    // Load additional data based on the selected dataset
    if (dataSet === 'full') {
      // Load all fixtures
      const fixturesPath = path.join(process.cwd(), 'tests', 'fixtures');
      
      if (fs.existsSync(path.join(fixturesPath, 'users.json'))) {
        const usersData = JSON.parse(fs.readFileSync(path.join(fixturesPath, 'users.json'), 'utf8'));
        for (const userData of usersData) {
          // Skip if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
          });
          
          if (!existingUser) {
            await prisma.user.create({
              data: {
                ...userData,
                password: await bcrypt.hash(userData.password || 'Password123!', 10)
              }
            });
          }
        }
      }
      
      if (fs.existsSync(path.join(fixturesPath, 'customers.json'))) {
        const customersData = JSON.parse(fs.readFileSync(path.join(fixturesPath, 'customers.json'), 'utf8'));
        for (const customerData of customersData) {
          await prisma.customer.create({
            data: customerData
          });
        }
      }
      
      if (fs.existsSync(path.join(fixturesPath, 'requests.json'))) {
        const requestsData = JSON.parse(fs.readFileSync(path.join(fixturesPath, 'requests.json'), 'utf8'));
        for (const requestData of requestsData) {
          await prisma.contactRequest.create({
            data: requestData
          });
        }
      }
    } else {
      // Just create a few more basic users for minimal dataset
      await prisma.user.createMany({
        data: [
          {
            name: 'Test Employee',
            email: 'testemployee@example.com',
            password: await bcrypt.hash('TestEmployee123!', 10),
            role: 'employee',
            status: 'active'
          },
          {
            name: 'Test Manager',
            email: 'testmanager@example.com',
            password: await bcrypt.hash('TestManager123!', 10),
            role: 'manager',
            status: 'active'
          }
        ],
        skipDuplicates: true
      });
    }
    
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  }
}

/**
 * Clear all data from the database (faster than recreating it)
 * @param prisma - Prisma client instance
 */
export async function clearTestData(prisma: PrismaClient): Promise<void> {
  try {
    // Clear data in reverse order of dependencies
    await prisma.userActivity.deleteMany({});
    await prisma.requestNote.deleteMany({});
    await prisma.requestLog.deleteMany({});
    await prisma.contactRequest.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.userSettings.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('Test data cleared');
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
}
