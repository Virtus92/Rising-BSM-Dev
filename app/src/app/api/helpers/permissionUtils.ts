// Mark as server-only to prevent client-side imports
import 'server-only';

/**
 * Permission Utilities for API Routes
 * 
 * Provides consistent permission checking methods to be used across API routes
 * Includes role-based data filtering for statistics and dashboard data
 */

import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * Checks if a user has a specific permission
 * 
 * @param userId - User ID to check permissions for
 * @param permission - Permission code to check
 * @param userRole - Optional user role (if not provided, will be fetched)
 * @returns Promise resolving to boolean indicating if user has permission
 */
export async function checkUserPermission(
  userId: number,
  permission: SystemPermission | string,
  userRole?: string
): Promise<boolean> {
  const logger = getLogger();
  
  try {
    // Validate inputs
    if (!userId || isNaN(userId) || userId <= 0) {
      logger.warn('Invalid user ID provided for permission check', { userId });
      return false;
    }
    
    if (!permission || typeof permission !== 'string' || permission.trim() === '') {
      logger.warn('Invalid permission code provided for permission check', { permission });
      return false;
    }
    
    // Normalize permission code
    const normalizedPermission = permission.trim().toLowerCase();
    
    // Get user role if not provided
    let role = userRole;
    if (!role) {
      const userRepository = (await import('@/core/factories/repositoryFactory')).getRepositoryFactory().createUserRepository();
      const user = await userRepository.findById(userId);
      role = user?.role;
    }
    
    // 🔑 FIX: Pass the role parameter to enable admin bypass
    return await permissionMiddleware.hasPermission(userId, normalizedPermission, role);
  } catch (error) {
    logger.error('Error checking user permission:', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      permission
    });
    return false; // Fail closed - deny permission if there's an error
  }
}

/**
 * Checks if a user has any of the specified permissions
 * 
 * @param userId - User ID to check permissions for
 * @param permissions - Array of permission codes
 * @param userRole - Optional user role (if not provided, will be fetched)
 * @returns Promise resolving to boolean indicating if user has any permission
 */
export async function checkUserHasAnyPermission(
  userId: number,
  permissions: (SystemPermission | string)[],
  userRole?: string
): Promise<boolean> {
  const logger = getLogger();
  
  // Validate inputs
  if (!userId || isNaN(userId) || userId <= 0) {
    logger.warn('Invalid user ID provided for permission check', { userId });
    return false;
  }
  
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    logger.warn('No permissions specified for checkUserHasAnyPermission');
    return false;
  }
  
  try {
    // Get user role if not provided
    let role = userRole;
    if (!role) {
      const userRepository = (await import('@/core/factories/repositoryFactory')).getRepositoryFactory().createUserRepository();
      const user = await userRepository.findById(userId);
      role = user?.role;
    }
    
    // 🔑 FIX: Admin bypass - if user is admin, they have all permissions
    if (role && role.toLowerCase() === 'admin') {
      logger.info(`Admin user ${userId} granted any permission from: ${permissions.join(', ')}`, { userId, role, permissions });
      return true;
    }
    
    // Check each permission individually using the permission middleware
    for (const permission of permissions) {
      const normalizedPermission = permission.toString().trim().toLowerCase();
      
      // 🔑 FIX: Pass the role parameter to enable admin bypass
      const hasPermission = await permissionMiddleware.hasPermission(userId, normalizedPermission, role);
      
      if (hasPermission) {
        return true; // User has at least one of the required permissions
      }
    }
    
    return false; // User doesn't have any of the required permissions
  } catch (error) {
    logger.error('Error checking user permissions:', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      permissions
    });
    return false; // Fail closed - deny permission if there's an error
  }
}

/**
 * Checks if a user has all of the specified permissions
 * 
 * @param userId - User ID to check permissions for
 * @param permissions - Array of permission codes
 * @param userRole - Optional user role (if not provided, will be fetched)
 * @returns Promise resolving to boolean indicating if user has all permissions
 */
export async function checkUserHasAllPermissions(
  userId: number,
  permissions: (SystemPermission | string)[],
  userRole?: string
): Promise<boolean> {
  const logger = getLogger();
  
  if (!permissions || permissions.length === 0) {
    logger.warn('No permissions specified for checkUserHasAllPermissions');
    return false;
  }
  
  try {
    // Get user role if not provided
    let role = userRole;
    if (!role) {
      const userRepository = (await import('@/core/factories/repositoryFactory')).getRepositoryFactory().createUserRepository();
      const user = await userRepository.findById(userId);
      role = user?.role;
    }
    
    // 🔑 FIX: Admin bypass - if user is admin, they have all permissions
    if (role && role.toLowerCase() === 'admin') {
      logger.info(`Admin user ${userId} granted all permissions: ${permissions.join(', ')}`, { userId, role, permissions });
      return true;
    }
    
    // Check each permission individually using the permission middleware
    for (const permission of permissions) {
      const normalizedPermission = permission.toString().trim().toLowerCase();
      
      // 🔑 FIX: Pass the role parameter to enable admin bypass
      const hasPermission = await permissionMiddleware.hasPermission(userId, normalizedPermission, role);
      
      if (!hasPermission) {
        return false; // User is missing at least one required permission
      }
    }
    
    return true; // User has all required permissions
  } catch (error) {
    logger.error('Error checking user permissions:', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      permissions
    });
    return false; // Fail closed - deny permission if there's an error
  }
}

/**
 * Filter data based on user role and context
 * 
 * @param userId - User ID requesting the data
 * @param dataItems - Array of data items to filter
 * @param getOwnerId - Function to extract owner ID from a data item
 * @returns Filtered array of data items
 */
export async function filterDataByUserRole<T>(
  userId: number,
  dataItems: T[],
  getOwnerId: (item: T) => number | undefined
): Promise<T[]> {
  try {
    const logger = getLogger();
    
    // Handle undefined or null data
    if (!dataItems || dataItems.length === 0) {
      return [];
    }
    
    if (!userId) {
      logger.warn('Missing userId in filterDataByUserRole');
      return [];
    }
    
    // Get user info including role
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    const user = await userService.getById(userId);
    
    if (!user) {
      logger.warn(`User not found with ID ${userId} in filterDataByUserRole`);
      return [];
    }
    
    // Admin role can see all data
    if (user.role === UserRole.ADMIN) {
      return dataItems;
    }
    
    // Manager role can see their own and subordinate employees' data
    if (user.role === UserRole.MANAGER) {
      // Get all users to find subordinate employees
      const usersResponse = await userService.findUsers({
        limit: 1000 // High limit to get all users
      });
      
      const users = usersResponse && usersResponse.data ? usersResponse.data : [];
      
      // Create a set for faster lookup when checking permissions
      const subordinateIdsSet = new Set<number>();
      
      // Add the manager's own ID
      subordinateIdsSet.add(userId);
      
      // Find all employees created by this manager
      users.forEach(employee => {
        // Include if manager created this employee
        if (employee.createdBy === userId) {
          subordinateIdsSet.add(employee.id);
        }
        
        // Check for extended properties (using type assertion safely)
        const extendedEmployee = employee as Record<string, any>;
        
        // Check supervisor relationship if that property exists
        if (extendedEmployee.supervisorId === userId) {
          subordinateIdsSet.add(employee.id);
        }
        
        // Check team relationship
        // Try to get teamId from user properties
        const employeeTeamId = 
          'teamId' in extendedEmployee ? extendedEmployee.teamId : 
          ('team' in extendedEmployee && extendedEmployee.team && typeof extendedEmployee.team === 'object' && 'id' in extendedEmployee.team) ? extendedEmployee.team.id : 
          ('metadata' in extendedEmployee && extendedEmployee.metadata && typeof extendedEmployee.metadata === 'object' && 'teamId' in extendedEmployee.metadata) ? extendedEmployee.metadata.teamId : 
          undefined;
        
        // Try to get the manager's teamId
        const managerTeamId = 
          'teamId' in user ? user.teamId : 
          ('team' in user && user.team && typeof user.team === 'object' && 'id' in user.team) ? user.team.id : 
          ('metadata' in user && user.metadata && typeof user.metadata === 'object' && 'teamId' in user.metadata) ? user.metadata.teamId : 
          undefined;
          
        // If both have team IDs and they match, add to subordinates
        if (employeeTeamId && managerTeamId && employeeTeamId === managerTeamId) {
          subordinateIdsSet.add(employee.id);
        }
      });
      
      // Return data items owned by the manager or their subordinates
      return dataItems.filter(item => {
        const ownerId = getOwnerId(item);
        return ownerId !== undefined && subordinateIdsSet.has(ownerId);
      });
    }
    
    // Regular employees can only see their own data
    return dataItems.filter(item => {
      const ownerId = getOwnerId(item);
      return ownerId === userId;
    });
  } catch (error) {
    const logger = getLogger();
    logger.error('Error in filterDataByUserRole:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    
    // In case of error, return empty array for safety
    return [];
  }
}

export const permissionUtils = {
  checkUserPermission,
  checkUserHasAnyPermission,
  checkUserHasAllPermissions,
  filterDataByUserRole
};

export default permissionUtils;