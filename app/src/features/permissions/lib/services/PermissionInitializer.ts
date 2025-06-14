/**
 * Permission System Initializer
 * 
 * This file provides functions to initialize and verify the permission system
 * during application startup.
 */

import { getLogger } from '@/core/logging';
import { db } from '@/core/db';
import { UserRole } from '@/domain/enums/UserEnums';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { clearPermissionCache } from '../utils/permissionCacheUtils';
import permissionValidator from '../utils/permissionValidation';

const logger = getLogger();

/**
 * Ensure default role permissions are set up for each role
 */
async function ensureRolePermissions(): Promise<void> {
  logger.info('Setting up default role permissions');
  
  // Check if RolePermission table exists
  try {
    await db.rolePermission.count();
  } catch (error) {
    logger.error('RolePermission table not accessible:', error as Error);
    throw new Error('RolePermission table not accessible');
  }
  
  // Get all permissions from the database
  const allPermissions = await db.permission.findMany();
  const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));
  
  // Define default permissions for each role
  const rolePermissions: Record<string, string[]> = {
    admin: Object.values(SystemPermission), // Admin gets ALL permissions
    manager: [
      // Basic permissions
      SystemPermission.DASHBOARD_ACCESS,
      SystemPermission.PROFILE_VIEW,
      SystemPermission.PROFILE_EDIT,
      
      // Customer permissions
      SystemPermission.CUSTOMERS_VIEW,
      SystemPermission.CUSTOMERS_CREATE,
      SystemPermission.CUSTOMERS_EDIT,
      
      // Request permissions
      SystemPermission.REQUESTS_VIEW,
      SystemPermission.REQUESTS_CREATE,
      SystemPermission.REQUESTS_EDIT,
      SystemPermission.REQUESTS_ASSIGN,
      
      // Appointment permissions
      SystemPermission.APPOINTMENTS_VIEW,
      SystemPermission.APPOINTMENTS_CREATE,
      SystemPermission.APPOINTMENTS_EDIT,
      
      // User permissions
      SystemPermission.USERS_VIEW,
      
      // Settings view only
      SystemPermission.SETTINGS_VIEW,
    ],
    employee: [
      // Basic permissions
      SystemPermission.DASHBOARD_ACCESS,
      SystemPermission.PROFILE_VIEW,
      SystemPermission.PROFILE_EDIT,
      
      // Limited customer permissions
      SystemPermission.CUSTOMERS_VIEW,
      
      // Limited request permissions
      SystemPermission.REQUESTS_VIEW,
      SystemPermission.REQUESTS_CREATE,
      
      // Limited appointment permissions
      SystemPermission.APPOINTMENTS_VIEW,
      SystemPermission.APPOINTMENTS_CREATE,
    ],
    user: [
      // Basic permissions only
      SystemPermission.DASHBOARD_ACCESS,
      SystemPermission.PROFILE_VIEW,
      SystemPermission.PROFILE_EDIT,
    ]
  };
  
  // Process each role
  const roleResults: Record<string, { success: boolean; count: number; error?: string }> = {};
  
  for (const [role, permissions] of Object.entries(rolePermissions)) {
    try {
      // Get existing role permissions
      const existingRolePermissions = await db.rolePermission.findMany({
        where: { role: role.toLowerCase() },
        select: { permissionId: true }
      });
      
      const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permissionId));
      
      // Get valid permission IDs for this role that don't already exist
      const permissionsToCreate = permissions
        .filter(code => permissionMap.has(code)) // Valid permission
        .map(code => permissionMap.get(code)!)
        .filter(id => !existingPermissionIds.has(id)); // Not already assigned
      
      if (permissionsToCreate.length > 0) {
        // Create the role permissions in a transaction
        await db.$transaction(async (tx) => {
          const now = new Date();
          
          // Create each permission
          for (const permissionId of permissionsToCreate) {
            await tx.rolePermission.create({
              data: {
                role: role.toLowerCase(),
                permissionId,
                createdAt: now,
                updatedAt: now
              }
            });
          }
        });
      }
      
      roleResults[role] = {
        success: true,
        count: permissionsToCreate.length
      };
      
      logger.info(`Created ${permissionsToCreate.length} role permissions for ${role}`);
    } catch (error) {
      logger.error(`Failed to set up role permissions for ${role}:`, error as Error);
      roleResults[role] = {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  // Log results
  const successCount = Object.values(roleResults).filter(r => r.success).length;
  logger.info(`Role permissions setup completed: ${successCount}/${Object.keys(roleResults).length} roles processed successfully`);
}

/**
 * Initialize the permission system during startup
 * This ensures:
 * 1. All system permissions are created in the database
 * 2. Default role permissions are set up properly
 * 3. Admin users have the required permissions
 * 4. Permission cache is cleared on startup
 */
export async function initializePermissionSystem(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    logger.info('Initializing permission system');
    
    // 0. Validate permission definitions
    permissionValidator.validateAllPermissions();
    
    // 1. Clear the permission cache on startup
    await clearPermissionCache();
    logger.info('Permission cache cleared on startup');
    
    // 2. Ensure all system permissions exist in the database
    const existingPermissions = await db.permission.findMany();
    const existingPermissionCodes = existingPermissions.map(p => p.code);
    
    // Get all permission codes from the SystemPermission enum
    const allSystemPermissions = Object.values(SystemPermission);
    
    // Find missing permissions
    const missingPermissions = allSystemPermissions.filter(
      code => !existingPermissionCodes.includes(code)
    );
    
    // Create missing permissions
    if (missingPermissions.length > 0) {
      logger.info(`Creating ${missingPermissions.length} missing system permissions`);
      
      for (const code of missingPermissions) {
        // Parse the code to generate a sensible name and description
        const parts = code.split('.');
        const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const action = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        const name = `${action} ${category}`;
        const description = `Can ${parts[1]} ${parts[0]}`;
        
        try {
          await db.permission.create({
            data: {
              code,
              name,
              description,
              category: parts[0].toUpperCase()
            }
          });
          logger.debug(`Created permission: ${code}`);
        } catch (error) {
          logger.error(`Failed to create permission ${code}:`, error as Error);
        }
      }
    }
    
    // 3. Initialize default role permissions for all roles
    await ensureRolePermissions();
    
    // 4. Verify admin users have the correct permissions
    // Get all users with ADMIN role
    const adminUsers = await db.user.findMany({
      where: { role: UserRole.ADMIN }
    });
    
    logger.info(`Found ${adminUsers.length} admin users for permission verification`);
    
    // Critical permissions that all admins must have
    const criticalPermissions = [
      SystemPermission.REQUESTS_VIEW,
      SystemPermission.CUSTOMERS_VIEW,
      SystemPermission.APPOINTMENTS_VIEW,
      SystemPermission.USERS_VIEW,
      SystemPermission.SETTINGS_VIEW,
      SystemPermission.SYSTEM_ADMIN
    ];
    
    // Get updated list of all permissions after creating missing ones
    const allPermissions = await db.permission.findMany();
    
    // Results of permission verification
    const verificationResults = [];
    
    // Check each admin user
    for (const admin of adminUsers) {
      try {
        // Get current permissions for this admin
        const userPermissions = await db.userPermission.findMany({
          where: { userId: admin.id },
          include: { permission: true }
        });
        
        const userPermissionCodes = userPermissions.map(up => up.permission.code);
        
        // Find critical permissions that are missing
        const missingCriticalPermissions = criticalPermissions.filter(
          code => !userPermissionCodes.includes(code)
        );
        
        // Grant missing critical permissions
        for (const code of missingCriticalPermissions) {
          const permission = allPermissions.find(p => p.code === code);
          
          if (permission) {
            try {
              await db.userPermission.upsert({
                where: {
                  userId_permissionId: {
                    userId: admin.id,
                    permissionId: permission.id
                  }
                },
                create: {
                  userId: admin.id,
                  permissionId: permission.id,
                  grantedAt: new Date(),
                  grantedBy: admin.id
                },
                update: {
                  grantedAt: new Date()
                }
              });
              
              logger.info(`Granted critical permission ${code} to admin user ${admin.id}`);
            } catch (error) {
              logger.error(`Failed to grant permission ${code} to admin ${admin.id}:`, error as Error);
            }
          }
        }
        
        verificationResults.push({
          userId: admin.id,
          email: admin.email,
          missingCriticalPermissionsCount: missingCriticalPermissions.length,
          allGrantedPermissionsCount: userPermissions.length,
          success: true
        });
      } catch (error) {
        logger.error(`Error verifying permissions for admin ${admin.id}:`, error as Error);
        verificationResults.push({
          userId: admin.id,
          email: admin.email,
          error: error instanceof Error ? error.message : String(error),
          success: false
        });
      }
    }
    
    const successCount = verificationResults.filter(r => r.success).length;
    
    // Return the results
    return {
      success: true,
      message: `Permission system initialized: ${missingPermissions.length} permissions created, ${successCount}/${adminUsers.length} admin users verified`,
      details: {
        missingPermissionsCreated: missingPermissions,
        adminVerificationResults: verificationResults
      }
    };
  } catch (error) {
    logger.error('Error initializing permission system:', error as Error);
    return {
      success: false,
      message: `Failed to initialize permission system: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    };
  }
}
