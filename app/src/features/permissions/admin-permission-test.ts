/**
 * Admin Permission Verification Script
 * 
 * This script tests the admin permission system to ensure it's working correctly.
 * Run this script to verify that admin users have all permissions.
 */

import { getLogger } from '@/core/logging';
import { db } from '@/core/db';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { checkUserHasAnyPermission, checkUserPermission } from '@/app/api/helpers/permissionUtils';
import { initializePermissionSystem } from '@/features/permissions/lib/services/PermissionInitializer';

const logger = getLogger();

/**
 * Test admin permissions for a specific user
 */
export async function testAdminPermissions(userId: number, role: string): Promise<{
  success: boolean;
  results: Array<{ permission: string; hasPermission: boolean; method: string; }>;
  summary: { total: number; passed: number; failed: number; };
}> {
  logger.info(`Testing admin permissions for user ${userId} with role '${role}'`);
  
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
  
  const results: Array<{ permission: string; hasPermission: boolean; method: string; }> = [];
  
  // Test using the permission middleware directly
  for (const permission of testPermissions) {
    try {
      const hasPermission = await permissionMiddleware.hasPermission(userId, permission, role);
      results.push({
        permission,
        hasPermission,
        method: 'permissionMiddleware.hasPermission'
      });
    } catch (error) {
      logger.error(`Error testing permission ${permission}`, { error });
      results.push({
        permission,
        hasPermission: false,
        method: 'permissionMiddleware.hasPermission (ERROR)'
      });
    }
  }
  
  // Test using the permission utils
  try {
    const hasAnyPermission = await checkUserHasAnyPermission(userId, testPermissions, role);
    results.push({
      permission: 'ANY_PERMISSION_CHECK',
      hasPermission: hasAnyPermission,
      method: 'checkUserHasAnyPermission'
    });
  } catch (error) {
    logger.error('Error testing checkUserHasAnyPermission', { error });
    results.push({
      permission: 'ANY_PERMISSION_CHECK',
      hasPermission: false,
      method: 'checkUserHasAnyPermission (ERROR)'
    });
  }
  
  // Test individual permission check
  try {
    const hasUserViewPermission = await checkUserPermission(userId, SystemPermission.USERS_VIEW, role);
    results.push({
      permission: SystemPermission.USERS_VIEW,
      hasPermission: hasUserViewPermission,
      method: 'checkUserPermission'
    });
  } catch (error) {
    logger.error('Error testing checkUserPermission', { error });
    results.push({
      permission: SystemPermission.USERS_VIEW,
      hasPermission: false,
      method: 'checkUserPermission (ERROR)'
    });
  }
  
  const summary = {
    total: results.length,
    passed: results.filter(r => r.hasPermission).length,
    failed: results.filter(r => !r.hasPermission).length
  };
  
  const success = role.toLowerCase() === 'admin' ? summary.failed === 0 : summary.passed < summary.total;
  
  logger.info(`Admin permission test completed for user ${userId}`, {
    role,
    summary,
    success
  });
  
  return { success, results, summary };
}

/**
 * Test the admin bypass mechanism specifically
 */
export async function testAdminBypass(): Promise<{
  success: boolean;
  testResults: Array<{ test: string; result: boolean; expected: boolean; passed: boolean; }>;
}> {
  logger.info('Testing admin bypass mechanism');
  
  const testResults = [];
  
  // Test 1: Admin role should return true
  try {
    const adminResult = await permissionMiddleware.hasPermission(999999, SystemPermission.USERS_DELETE, 'admin');
    testResults.push({
      test: 'Admin role bypass',
      result: adminResult,
      expected: true,
      passed: adminResult === true
    });
  } catch (error) {
    testResults.push({
      test: 'Admin role bypass',
      result: false,
      expected: true,
      passed: false
    });
  }
  
  // Test 2: Non-admin role should not bypass
  try {
    const userResult = await permissionMiddleware.hasPermission(999999, SystemPermission.USERS_DELETE, 'user');
    testResults.push({
      test: 'Non-admin role (should not bypass)',
      result: userResult,
      expected: false,
      passed: userResult === false
    });
  } catch (error) {
    testResults.push({
      test: 'Non-admin role (should not bypass)',
      result: false,
      expected: false,
      passed: true // Error is expected for invalid user
    });
  }
  
  // Test 3: No role provided should not bypass
  try {
    const noRoleResult = await permissionMiddleware.hasPermission(999999, SystemPermission.USERS_DELETE);
    testResults.push({
      test: 'No role provided (should not bypass)',
      result: noRoleResult,
      expected: false,
      passed: noRoleResult === false
    });
  } catch (error) {
    testResults.push({
      test: 'No role provided (should not bypass)',
      result: false,
      expected: false,
      passed: true // Error is expected for invalid user
    });
  }
  
  const allPassed = testResults.every(test => test.passed);
  
  logger.info('Admin bypass test completed', {
    success: allPassed,
    results: testResults
  });
  
  return {
    success: allPassed,
    testResults
  };
}

/**
 * Find admin users in the system
 */
export async function findAdminUsers(): Promise<Array<{ id: number; email: string; role: string; }>> {
  try {
    const adminUsers = await db.user.findMany({
      where: {
        role: {
          in: ['admin', 'ADMIN', 'Admin']
        }
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    logger.info(`Found ${adminUsers.length} admin users`);
    return adminUsers;
  } catch (error) {
    logger.error('Error finding admin users', { error });
    return [];
  }
}

/**
 * Run comprehensive permission system test
 */
export async function runPermissionSystemTest(adminUserId?: number): Promise<{
  success: boolean;
  details: {
    initialization: any;
    adminUsers: Array<{ id: number; email: string; role: string; }>;
    bypassTest: any;
    adminPermissionTests: Array<any>;
  };
}> {
  logger.info('Running comprehensive permission system test');
  
  try {
    // 1. Initialize permission system
    logger.info('Step 1: Initializing permission system');
    const initResult = await initializePermissionSystem();
    
    // 2. Find admin users
    logger.info('Step 2: Finding admin users');
    const adminUsers = await findAdminUsers();
    
    // 3. Test admin bypass mechanism
    logger.info('Step 3: Testing admin bypass mechanism');
    const bypassTest = await testAdminBypass();
    
    // 4. Test actual admin users
    logger.info('Step 4: Testing actual admin users');
    const adminPermissionTests = [];
    
    const usersToTest = adminUserId ? [{ id: adminUserId, role: 'admin', email: 'specified' }] : adminUsers;
    
    for (const user of usersToTest) {
      const testResult = await testAdminPermissions(user.id, user.role);
      adminPermissionTests.push({
        userId: user.id,
        email: user.email,
        role: user.role,
        ...testResult
      });
    }
    
    const allTestsPassed = (
      initResult.success &&
      bypassTest.success &&
      adminPermissionTests.every(test => test.success)
    );
    
    const result = {
      success: allTestsPassed,
      details: {
        initialization: initResult,
        adminUsers,
        bypassTest,
        adminPermissionTests
      }
    };
    
    logger.info('Comprehensive permission system test completed', {
      success: allTestsPassed,
      adminUsersFound: adminUsers.length,
      adminUsersTestedSuccessfully: adminPermissionTests.filter(t => t.success).length
    });
    
    return result;
  } catch (error) {
    logger.error('Error in comprehensive permission system test', { error });
    return {
      success: false,
      details: {
        initialization: { success: false, error: String(error) },
        adminUsers: [],
        bypassTest: { success: false, error: String(error) },
        adminPermissionTests: []
      }
    };
  }
}

/**
 * Simple test function that can be called from API routes
 */
export async function quickAdminTest(adminUserId: number): Promise<{
  isAdmin: boolean;
  hasPermissions: boolean;
  permissions: Array<{ permission: string; hasPermission: boolean; }>;
}> {
  try {
    // Get user info
    const user = await db.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, email: true, role: true }
    });
    
    if (!user) {
      return {
        isAdmin: false,
        hasPermissions: false,
        permissions: []
      };
    }
    
    const isAdmin = user.role.toLowerCase() === 'admin';
    
    // Test a few key permissions
    const testPermissions = [
      SystemPermission.USERS_VIEW,
      SystemPermission.CUSTOMERS_VIEW,
      SystemPermission.SETTINGS_VIEW
    ];
    
    const permissionResults = [];
    
    for (const permission of testPermissions) {
      const hasPermission = await permissionMiddleware.hasPermission(
        adminUserId,
        permission,
        user.role
      );
      
      permissionResults.push({
        permission,
        hasPermission
      });
    }
    
    const hasAllPermissions = permissionResults.every(p => p.hasPermission);
    
    return {
      isAdmin,
      hasPermissions: hasAllPermissions,
      permissions: permissionResults
    };
  } catch (error) {
    logger.error('Error in quick admin test', { error, adminUserId });
    return {
      isAdmin: false,
      hasPermissions: false,
      permissions: []
    };
  }
}