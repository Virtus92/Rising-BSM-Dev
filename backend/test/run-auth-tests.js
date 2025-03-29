/**
 * Simple script to run only the authentication tests
 */
import { execSync } from 'child_process';

console.log('Running authentication tests...');

try {
  // Run unit tests for auth components
  console.log('\n📋 Running unit tests for authentication components...\n');
  execSync('npx jest --config=jest.config.js "test/unit/auth/.*\\.test\\.(ts|js)$"', { stdio: 'inherit' });
  
  // Run integration tests for auth
  console.log('\n📋 Running integration tests for authentication API...\n');
  execSync('npx jest --config=jest.config.js "test/integration/auth\\.test\\.(ts|js)$"', { stdio: 'inherit' });
  
  console.log('\n✅ All authentication tests completed successfully!');
} catch (error) {
  console.error('\n❌ Some tests failed!');
  process.exit(1);
}