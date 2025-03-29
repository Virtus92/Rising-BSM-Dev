import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

/**
 * A singleton Prisma client for tests
 */
class TestDatabase {
  private static instance: TestDatabase;
  private client: PrismaClient | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  /**
   * Initialize the test database
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Set the test database URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/rising_bsm_test';

    try {
      // Create a fresh client
      this.client = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        log: process.env.NODE_ENV === 'test' ? [] : ['error']
      });

      // Apply migrations or create fresh schema
      try {
        console.log('Setting up test database schema...');
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit', 
          cwd: projectRoot,
          env: { ...process.env }
        });
      } catch (error) {
        console.error('Error applying migrations:', error);
        throw error;
      }

      this.isInitialized = true;
      console.log('Test database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize test database:', error);
      throw error;
    }
  }

  /**
   * Get the Prisma client
   */
  public getClient(): PrismaClient {
    if (!this.client || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Clean the database (truncate all tables)
   */
  public async cleanDatabase(): Promise<void> {
    if (!this.client) return;

    // List of tables to truncate - adjust based on your schema
    const tables = [
      'UserActivity',
      'RefreshToken',
      'RequestNote',
      'RequestLog',
      'ContactRequest',
      'CustomerLog',
      'Customer',
      'Notification',
      'UserSettings',
      'SystemSettings',
      'User'
    ];

    // Use a transaction to truncate all tables
    try {
      await this.client.$transaction(async (prisma) => {
        // Disable foreign key checks for PostgreSQL
        await prisma.$executeRawUnsafe('SET session_replication_role = \'replica\';');
        
        // Truncate all tables
        for (const table of tables) {
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
        }
        
        // Re-enable foreign key checks
        await prisma.$executeRawUnsafe('SET session_replication_role = \'origin\';');
      });
      
      console.log('Database cleaned successfully');
    } catch (error) {
      console.error('Error cleaning database:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  public async closeConnection(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
      this.client = null;
      this.isInitialized = false;
    }
  }
}

// Export a function to get the Prisma client
export async function getTestPrismaClient(): Promise<PrismaClient> {
  const testDatabase = TestDatabase.getInstance();
  await testDatabase.initialize();
  return testDatabase.getClient();
}

// Export a function to clean the database
export async function cleanTestDatabase(): Promise<void> {
  const testDatabase = TestDatabase.getInstance();
  await testDatabase.cleanDatabase();
}

// Export a function to close the database connection
export async function closeTestDatabase(): Promise<void> {
  const testDatabase = TestDatabase.getInstance();
  await testDatabase.closeConnection();
}

export default TestDatabase;
