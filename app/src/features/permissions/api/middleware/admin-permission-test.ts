/**
 * Admin Permission Test
 * 
 * This script tests whether admin users have access to all permissions
 */

import { permissionMiddleware } from './permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Test admin permissions for a specific user
 */
export async function testAdminPermissions(userId: number, role: string = 'admin'): Promise<{
  success: boolean;
  results: Record<string, boolean>;
  errors: string[];
}> {
  const results: Record<string, boolean> = {};
  const errors: string[] = [];
  
  logger.info(`Testing admin permissions for user ${userId} with role ${role}`);
  
  // Test a selection of permissions
  const testPermissions = [
    SystemPermission.USERS_VIEW,
    SystemPermission.USERS_CREATE,
    SystemPermission.USERS_EDIT,
    SystemPermission.USERS_DELETE,
    SystemPermission.CUSTOMERS_VIEW,
    SystemPermission.CUSTOMERS_CREATE,
    SystemPermission.CUSTOMERS_EDIT,
    SystemPermission.CUSTOMERS_DELETE,
    SystemPermission.REQUESTS_VIEW,
    SystemPermission.REQUESTS_CREATE,
    SystemPermission.REQUESTS_EDIT,
    SystemPermission.REQUESTS_DELETE,
    SystemPermission.APPOINTMENTS_VIEW,
    SystemPermission.APPOINTMENTS_CREATE,
    SystemPermission.APPOINTMENTS_EDIT,
    SystemPermission.APPOINTMENTS_DELETE,
    SystemPermission.SETTINGS_VIEW,
    SystemPermission.SETTINGS_EDIT,
    SystemPermission.PERMISSIONS_VIEW,
    SystemPermission.PERMISSIONS_MANAGE
  ];
  
  for (const permission of testPermissions) {
    try {
      const hasPermission = await permissionMiddleware.hasPermission(userId, permission, role);
      results[permission] = hasPermission;
      
      if (!hasPermission && role.toLowerCase() === 'admin') {
        errors.push(`Admin user ${userId} denied permission: ${permission}`);
      }
      
      logger.debug(`Permission ${permission}: ${hasPermission ? 'GRANTED' : 'DENIED'}`);
    } catch (error) {
      const errorMsg = `Error checking permission ${permission}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      results[permission] = false;
    }
  }
  
  const grantedCount = Object.values(results).filter(Boolean).length;
  const totalCount = testPermissions.length;
  
  logger.info(`Permission test results: ${grantedCount}/${totalCount} permissions granted`);
  
  if (errors.length > 0) {
    logger.error(`Permission test errors:`, errors);
  }
  
  return {
    success: errors.length === 0 && (role.toLowerCase() !== 'admin' || grantedCount === totalCount),
    results,
    errors
  };
}

/**
 * Test the admin bypass specifically
 */
export async function testAdminBypass(): Promise<{
  success: boolean;
  message: string;
  details: any;
}> {
  logger.info('Testing admin permission bypass...');
  
  try {
    // Test with admin role
    const adminResult = await permissionMiddleware.hasPermission(
      999999, // Non-existent user ID to test bypass
      SystemPermission.SYSTEM_ADMIN,
      'admin'
    );
    
    // Test with non-admin role
    const userResult = await permissionMiddleware.hasPermission(
      999999,
      SystemPermission.SYSTEM_ADMIN,
      'user'
    );
    
    const adminBypassWorking = adminResult === true;
    const userBypassNotWorking = userResult === false;
    
    const success = adminBypassWorking && userBypassNotWorking;
    
    return {
      success,
      message: success 
        ? 'Admin bypass is working correctly' 
        : 'Admin bypass is not working properly',
      details: {
        adminResult,
        userResult,
        adminBypassWorking,
        userBypassNotWorking
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error testing admin bypass: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    };
  }
}

/**
 * Comprehensive permission system test
 */
export async function runPermissionSystemTest(adminUserId?: number): Promise<{
  success: boolean;
  message: string;
  details: any;
}> {
  logger.info('Running comprehensive permission system test...');
  
  try {
    // Test 1: Admin bypass mechanism
    const bypassTest = await testAdminBypass();
    
    // Test 2: Admin user permissions (if user ID provided)
    let adminTest = null;
    if (adminUserId) {
      adminTest = await testAdminPermissions(adminUserId, 'admin');
    }
    
    // Test 3: Non-admin user permissions
    const userTest = await testAdminPermissions(999998, 'user');
    
    const allTestsPassed = bypassTest.success && 
                          (adminTest?.success !== false) && 
                          userTest.success;
    
    return {
      success: allTestsPassed,
      message: allTestsPassed 
        ? 'All permission system tests passed' 
        : 'Some permission system tests failed',
      details: {
        bypassTest,
        adminTest,
        userTest
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error running permission system test: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    };
  }
}

export default {
  testAdminPermissions,
  testAdminBypass,
  runPermissionSystemTest
};
