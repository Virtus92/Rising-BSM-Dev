/**
 * Jest global setup
 * Runs once before all tests
 */
import { setupTestEnvironment, setupTestDatabase } from './test-helpers.js';

export default async function() {
  console.log('🚀 Starting global test setup...');
  
  // Setup test environment variables
  setupTestEnvironment();
  
  // Setup shared test database (only for integration/API tests)
  if (process.env.JEST_TEST_TYPE === 'integration' || process.env.JEST_TEST_TYPE === 'api') {
    global.__TEST_DB_NAME__ = await setupTestDatabase(false);
    console.log(`📊 Global test database created: ${global.__TEST_DB_NAME__}`);
  }
  
  console.log('✅ Global test setup complete');
}
