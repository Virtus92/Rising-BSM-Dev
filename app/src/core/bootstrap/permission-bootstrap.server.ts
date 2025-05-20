/**
 * Permission System Bootstrap
 * 
 * This file contains the bootstrap process for the permission system.
 * It ensures that all required database models are created and initialized.
 */

import { getLogger } from '@/core/logging';
import { db } from '@/core/db';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { initializePermissionSystem } from '@/features/permissions/lib/services/PermissionInitializer';

const logger = getLogger();

/**
 * Initialize the permission system on server startup
 */
export async function bootstrapPermissionSystem(): Promise<void> {
  logger.info('Bootstrapping permission system...');
  
  try {
    // Verify database is accessible
    const databaseStatus = await verifyDatabaseAccess();
    
    if (!databaseStatus.success) {
      logger.error('Cannot bootstrap permission system - database is not accessible', {
        error: databaseStatus.error
      });
      return;
    }
    
    // Initialize permission system
    const initResult = await initializePermissionSystem();
    
    if (initResult.success) {
      logger.info('Permission system bootstrap complete', {
        message: initResult.message
      });
    } else {
      logger.error('Permission system bootstrap failed', {
        message: initResult.message,
        details: initResult.details
      });
    }
  } catch (error) {
    logger.error('Unexpected error during permission system bootstrap', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Verify that we have access to the database and the required models
 */
async function verifyDatabaseAccess(): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to access User model
    await db.user.count();
    
    // Check Permission model
    const hasPermissionModel = !!db.permission;
    if (!hasPermissionModel) {
      return {
        success: false,
        error: 'Permission model is not available in the database client'
      };
    }
    
    // Check RolePermission model
    const hasRolePermissionModel = !!db.rolePermission;
    if (!hasRolePermissionModel) {
      return {
        success: false,
        error: 'RolePermission model is not available in the database client'
      };
    }
    
    // Check UserPermission model
    const hasUserPermissionModel = !!db.userPermission;
    if (!hasUserPermissionModel) {
      return {
        success: false,
        error: 'UserPermission model is not available in the database client'
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Ensures the database has necessary permission models by checking their existence.
 * Should be called at application startup.
 */
export async function ensurePermissionModels(): Promise<boolean> {
  logger.info('Verifying permission models in database...');
  
  try {
    // Check if Permission model exists by checking one permission
    const permissionCount = await db.permission.count();
    logger.info(`Found ${permissionCount} permissions in database`);
    
    // If no permissions, try to create a test permission
    if (permissionCount === 0) {
      // Create a test permission
      await db.permission.create({
        data: {
          code: SystemPermission.DASHBOARD_ACCESS,
          name: 'Access Dashboard',
          description: 'Allows access to the main dashboard',
          category: 'DASHBOARD'
        }
      });
      logger.info('Created test permission successfully');
    }
    
    // Check the role permission model
    try {
      await db.rolePermission.count();
      logger.info('RolePermission model verified successfully');
    } catch (error) {
      logger.error('Error accessing RolePermission model', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
    
    // Check the user permission model
    try {
      await db.userPermission.count();
      logger.info('UserPermission model verified successfully');
    } catch (error) {
      logger.error('Error accessing UserPermission model', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error verifying permission models', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}
