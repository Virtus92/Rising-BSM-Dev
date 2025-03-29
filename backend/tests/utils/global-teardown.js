/**
 * Jest global teardown
 * Runs once after all tests
 */
import { cleanupTestDatabase } from './test-helpers.js';

export default async function() {
  console.log('🧹 Starting global test cleanup...');
  
  // Cleanup shared test database (only for integration/API tests)
  if (process.env.JEST_TEST_TYPE === 'integration' || process.env.JEST_TEST_TYPE === 'api') {
    if (global.__TEST_DB_NAME__) {
      await cleanupTestDatabase(global.__TEST_DB_NAME__);
      console.log(`🗑️ Global test database cleaned up: ${global.__TEST_DB_NAME__}`);
    }
  }
  
  console.log('✅ Global test cleanup complete');
}
