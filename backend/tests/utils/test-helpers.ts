import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getTestPrismaClient, cleanTestDatabase } from './test-database.js';
import { UserStatus } from '../../src/entities/User.js';

/**
 * Set up the test environment variables
 */
export function setupTestEnvironment(): void {
  // Set essential environment variables for tests
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.RATE_LIMIT_ENABLED = 'false';
  process.env.LOG_LEVEL = 'error';
  process.env.API_PREFIX = '/API/v1';
  process.env.CORS_ENABLED = 'true';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
  process.env.TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/rising_bsm_test';
}

/**
 * Create a test user in the database
 * @returns The created user object
 */
export async function createTestUser(
  prisma: PrismaClient,
  {
    email = 'test-user@example.com',
    password = 'TestPassword123!',
    name = 'Test User',
    role = 'employee',
    status = UserStatus.ACTIVE
  } = {}
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      status
    }
  });
  
  return user;
}

/**
 * Create a test admin in the database
 * @returns The created admin user object
 */
export async function createTestAdmin(
  prisma: PrismaClient,
  {
    email = 'test-admin@example.com',
    password = 'AdminPassword123!',
    name = 'Test Admin'
  } = {}
) {
  return createTestUser(prisma, {
    email,
    password,
    name,
    role: 'admin'
  });
}

/**
 * Create a test customer in the database
 * @returns The created customer object
 */
export async function createTestCustomer(
  prisma: PrismaClient,
  {
    name = 'Test Customer',
    email = 'customer@example.com',
    company = 'Test Company',
    phone = '+49 123 456 789',
    status = 'active'
  } = {}
) {
  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      company,
      phone,
      status
    }
  });
  
  return customer;
}

/**
 * Generate a random email for testing
 */
export function generateRandomEmail(): string {
  return `test-${Math.random().toString(36).substring(2, 10)}@example.com`;
}

/**
 * Wait for a specified time (in milliseconds)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Setup all test resources (database, users, etc.)
 */
export async function setupTestResources() {
  // Get test database client
  const prisma = await getTestPrismaClient();
  
  // Create test users and return details
  const admin = await createTestAdmin(prisma);
  const user = await createTestUser(prisma);
  
  return {
    prisma,
    admin,
    user,
    adminId: admin.id,
    userId: user.id
  };
}

/**
 * Setup test database for integration and API tests
 * @param cleanup Clean the database before setup
 * @returns Database name
 */
export async function setupTestDatabase(cleanup: boolean = true): Promise<string> {
  // Generate a simple timestamp-based identifier for this test run
  const dbIdentifier = `test_${Date.now()}`;
  
  // Get the test database client
  const prisma = await getTestPrismaClient();
  
  // Clean database if requested
  if (cleanup) {
    await cleanTestDatabase();
  }
  
  console.log(`Test database ready: ${process.env.TEST_DATABASE_URL}`);
  
  return dbIdentifier;
}
