/**
 * Test Configuration
 * 
 * Centralized configuration for testing.
 */

export default {
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'rising_bsm_test',
    ssl: process.env.DB_SSL === 'true',
    generateUnique: true,
    keepAlive: false
  },
  
  // Authentication settings
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'test-jwt-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Test timeout settings
  timeouts: {
    default: 10000,
    database: 30000,
    api: 15000,
    integration: 20000
  },
  
  // Default test data
  testData: {
    admin: {
      email: 'testadmin@example.com',
      password: 'TestAdmin123!',
      name: 'Test Admin',
      role: 'admin'
    },
    employee: {
      email: 'testemployee@example.com',
      password: 'TestEmployee123!',
      name: 'Test Employee',
      role: 'employee'
    },
    customer: {
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '+49 123 456 789',
      company: 'Test Company GmbH',
      address: 'Teststraße 1',
      postalCode: '12345',
      city: 'Teststadt',
      country: 'Deutschland',
      type: 'business'
    }
  },
  
  // Environment detection helpers
  env: {
    isCI: process.env.CI === 'true',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test'
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'error',
    consoleOutput: process.env.TEST_CONSOLE_OUTPUT === 'true'
  }
};
