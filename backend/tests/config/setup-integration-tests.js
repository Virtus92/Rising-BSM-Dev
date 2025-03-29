/**
 * Setup Integration Tests
 * 
 * This file sets up the environment specifically for integration tests.
 */
import { setupTestEnvironment } from '../utils/test-helpers.js';

// Set environment type for conditional logic in setup
process.env.JEST_TEST_TYPE = 'integration';

// Load test environment variables
setupTestEnvironment();

// Set test timeout
jest.setTimeout(60000);

// Create a shared variable for the database name
beforeAll(async () => {
  // This will be run once before all tests in this file
  global.__INTEGRATION_TEST_STARTED__ = new Date().toISOString();
  console.log(`Starting integration tests at ${global.__INTEGRATION_TEST_STARTED__}`);
});

// Clean up after all tests
afterAll(async () => {
  const startTime = global.__INTEGRATION_TEST_STARTED__;
  const endTime = new Date().toISOString();
  console.log(`Completed integration tests. Started: ${startTime}, Ended: ${endTime}`);
});
