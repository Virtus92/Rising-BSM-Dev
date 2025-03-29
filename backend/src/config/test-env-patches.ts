/**
 * Test Environment Patches
 * 
 * This module contains patches and fixes for testing environment.
 * These are used to work around issues that occur in test mode but
 * don't impact production code.
 */

// If in test environment, patch global objects and utils
if (process.env.NODE_ENV === 'test') {
  console.log('🔧 Applying test environment patches...');
  
  // Mock the fileURLToPath function to avoid import.meta issues
  // This helps tests run without hitting the import.meta TypeScript error
  const mockPath = {
    dirname: (path: string) => {
      // Very simplified directory path handling for tests
      // Just returns a reasonable approximation for basic use cases
      if (path.includes('/')) {
        return path.substring(0, path.lastIndexOf('/'));
      } else if (path.includes('\\')) {
        return path.substring(0, path.lastIndexOf('\\'));
      }
      return '.';
    },
    resolve: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
    join: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/')
  };
  
  // This simulates a file URL path for __filename equivalent
  const mockFileURL = (url: string) => {
    return process.cwd() + '/src/mocked-file';
  };
  
  // Export these mock functions
  export { mockPath, mockFileURL };
  
  console.log('✅ Test environment patches applied');
} else {
  // In non-test environments, export dummy functions that should never be used
  export const mockPath = null;
  export const mockFileURL = null;
}
