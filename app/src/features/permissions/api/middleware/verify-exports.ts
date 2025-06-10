/**
 * Permission Middleware Verification
 * Tests that all exports are working correctly
 */

// Test direct import from the main file
import { permissionMiddleware as directMiddleware } from './permissionMiddleware';

// Test import from the index (barrel export)
import { permissionMiddleware as indexMiddleware } from './index';

// Test destructured imports
import { 
  hasPermission, 
  checkPermission, 
  API_PERMISSIONS 
} from './index';

// Test default import
import defaultMiddleware from './index';

// Verification function
export function verifyPermissionMiddleware() {
  console.log('Verifying permission middleware exports...');
  
  // Check that all middleware objects exist
  if (!directMiddleware) {
    throw new Error('Direct middleware import failed');
  }
  
  if (!indexMiddleware) {
    throw new Error('Index middleware import failed');
  }
  
  if (!defaultMiddleware) {
    throw new Error('Default middleware import failed');
  }
  
  // Check that required methods exist
  const requiredMethods = ['hasPermission', 'checkPermission', 'API_PERMISSIONS'];
  
  for (const method of requiredMethods) {
    if (!(method in directMiddleware)) {
      throw new Error(`Method ${method} missing from direct middleware`);
    }
    
    if (!(method in indexMiddleware)) {
      throw new Error(`Method ${method} missing from index middleware`);
    }
    
    if (!(method in defaultMiddleware)) {
      throw new Error(`Method ${method} missing from default middleware`);
    }
  }
  
  // Check that standalone functions exist
  if (typeof hasPermission !== 'function') {
    throw new Error('hasPermission function not exported');
  }
  
  if (typeof checkPermission !== 'function') {
    throw new Error('checkPermission function not exported');
  }
  
  if (!API_PERMISSIONS) {
    throw new Error('API_PERMISSIONS not exported');
  }
  
  console.log('✅ All permission middleware exports verified successfully!');
  
  return {
    directMiddleware,
    indexMiddleware,
    defaultMiddleware,
    hasPermission,
    checkPermission,
    API_PERMISSIONS
  };
}

// Export for testing
export default verifyPermissionMiddleware;
