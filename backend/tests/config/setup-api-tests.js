/**
 * Setup API Tests
 * 
 * This file sets up the environment specifically for API tests.
 */
import { setupTestEnvironment } from '../utils/test-helpers.js';

// Set environment type for conditional logic in setup
process.env.JEST_TEST_TYPE = 'api';

// Load test environment variables
setupTestEnvironment();

// Set test timeout - API tests need more time
jest.setTimeout(90000);

// Create a shared variable for the database name
beforeAll(async () => {
  // This will be run once before all tests in this file
  global.__API_TEST_STARTED__ = new Date().toISOString();
  console.log(`Starting API tests at ${global.__API_TEST_STARTED__}`);
});

// Clean up after all tests
afterAll(async () => {
  const startTime = global.__API_TEST_STARTED__;
  const endTime = new Date().toISOString();
  console.log(`Completed API tests. Started: ${startTime}, Ended: ${endTime}`);
});
