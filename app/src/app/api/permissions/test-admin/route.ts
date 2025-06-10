/**
 * Admin Permission Test API Route
 * 
 * This endpoint allows testing of the admin permission system.
 * Only accessible to admin users for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';
import { 
  testAdminPermissions, 
  testAdminBypass, 
  findAdminUsers, 
  runPermissionSystemTest,
  quickAdminTest 
} from '@/features/permissions/admin-permission-test';

const logger = getLogger();

/**
 * GET /api/permissions/test-admin
 * 
 * Test admin permissions for the current user or specified user
 */
export const GET = routeHandler(
  async (req: NextRequest) => {
    try {
      const auth = (req as any).auth;
      const currentUserId = auth?.userId;
      const currentUserRole = auth?.role;
      
      logger.info('Admin permission test requested', {
        userId: currentUserId,
        role: currentUserRole
      });
      
      // Get query parameters
      const searchParams = req.nextUrl.searchParams;
      const testType = searchParams.get('type') || 'quick';
      const targetUserId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : currentUserId;
      
      let result;
      
      switch (testType) {
        case 'quick':
          result = await quickAdminTest(targetUserId);
          break;
          
        case 'detailed':
          result = await testAdminPermissions(targetUserId, currentUserRole);
          break;
          
        case 'bypass':
          result = await testAdminBypass();
          break;
          
        case 'comprehensive':
          result = await runPermissionSystemTest(targetUserId);
          break;
          
        case 'find-admins':
          result = await findAdminUsers();
          break;
          
        default:
          return NextResponse.json(
            formatResponse.error('Invalid test type. Use: quick, detailed, bypass, comprehensive, or find-admins', 400),
            { status: 400 }
          );
      }
      
      return NextResponse.json(
        formatResponse.success(result, `Admin permission test (${testType}) completed successfully`)
      );
    } catch (error) {
      logger.error('Error in admin permission test', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return NextResponse.json(
        formatResponse.error(
          error instanceof Error ? error.message : 'Failed to run admin permission test',
          500
        ),
        { status: 500 }
      );
    }
  },
  {
    requiresAuth: true,
    requiredPermission: [SystemPermission.SYSTEM_ADMIN, SystemPermission.PERMISSIONS_MANAGE],
    allowApiKeyAuth: true,
    allowedApiKeyTypes: ['admin']
  }
);

/**
 * POST /api/permissions/test-admin
 * 
 * Run specific permission tests with custom parameters
 */
export const POST = routeHandler(
  async (req: NextRequest) => {
    try {
      const auth = (req as any).auth;
      const currentUserId = auth?.userId;
      const currentUserRole = auth?.role;
      
      logger.info('Custom admin permission test requested', {
        userId: currentUserId,
        role: currentUserRole
      });
      
      // Parse request body
      const data = await req.json();
      const { testType, userId, permissions, role } = data;
      
      if (!testType) {
        return NextResponse.json(
          formatResponse.error('testType is required in request body', 400),
          { status: 400 }
        );
      }
      
      let result;
      
      switch (testType) {
        case 'custom-permissions':
          if (!permissions || !Array.isArray(permissions)) {
            return NextResponse.json(
              formatResponse.error('permissions array is required for custom-permissions test', 400),
              { status: 400 }
            );
          }
          
          const targetUserId = userId || currentUserId;
          const targetRole = role || currentUserRole;
          
          result = await testAdminPermissions(targetUserId, targetRole);
          break;
          
        case 'verify-fix':
          // Specific test to verify the admin permission fix
          const fixTestUserId = userId || currentUserId;
          const fixTestRole = role || currentUserRole;
          
          // Test the specific functions that were fixed
          const { checkUserHasAnyPermission, checkUserPermission } = await import('@/app/api/helpers/permissionUtils');
          const { permissionMiddleware } = await import('@/features/permissions/api/middleware/permissionMiddleware');
          
          const testPermissions = [SystemPermission.USERS_VIEW, SystemPermission.CUSTOMERS_VIEW];
          
          const directMiddlewareTest = await permissionMiddleware.hasPermission(
            fixTestUserId, 
            SystemPermission.USERS_VIEW, 
            fixTestRole
          );
          
          const utilsAnyTest = await checkUserHasAnyPermission(
            fixTestUserId,
            testPermissions,
            fixTestRole
          );
          
          const utilsSingleTest = await checkUserPermission(
            fixTestUserId,
            SystemPermission.USERS_VIEW,
            fixTestRole
          );
          
          result = {
            userId: fixTestUserId,
            role: fixTestRole,
            isAdmin: fixTestRole?.toLowerCase() === 'admin',
            tests: {
              directMiddleware: directMiddlewareTest,
              utilsAnyPermission: utilsAnyTest,
              utilsSinglePermission: utilsSingleTest
            },
            expectedResult: fixTestRole?.toLowerCase() === 'admin',
            success: fixTestRole?.toLowerCase() === 'admin' ? 
              (directMiddlewareTest && utilsAnyTest && utilsSingleTest) :
              true // For non-admins, we don't expect all permissions
          };
          break;
          
        default:
          return NextResponse.json(
            formatResponse.error('Invalid testType. Use: custom-permissions or verify-fix', 400),
            { status: 400 }
          );
      }
      
      logger.info('Custom admin permission test completed', {
        testType,
        success: result.success !== false
      });
      
      return NextResponse.json(
        formatResponse.success(result, `Custom admin permission test (${testType}) completed`)
      );
    } catch (error) {
      logger.error('Error in custom admin permission test', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return NextResponse.json(
        formatResponse.error(
          error instanceof Error ? error.message : 'Failed to run custom admin permission test',
          500
        ),
        { status: 500 }
      );
    }
  },
  {
    requiresAuth: true,
    requiredPermission: [SystemPermission.SYSTEM_ADMIN, SystemPermission.PERMISSIONS_MANAGE],
    allowApiKeyAuth: true,
    allowedApiKeyTypes: ['admin']
  }
);