'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';

/**
 * Custom hook that provides permissions for customer-related features
 * This works around issues with the main permission system by deriving permissions from the user role
 */
export const useCustomerPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate permissions based on user role
  useEffect(() => {
    setIsLoading(true);
    
    // Default permissions for all roles
    const defaultPermissions = [
      SystemPermission.SYSTEM_ACCESS,
      SystemPermission.PROFILE_VIEW,
      SystemPermission.PROFILE_EDIT
    ];
    
    // Role-based permissions
    let rolePermissions: string[] = [];
    
    if (user?.role) {
      switch(user.role) {
        case UserRole.ADMIN:
          rolePermissions = [
            SystemPermission.CUSTOMERS_VIEW,
            SystemPermission.CUSTOMERS_CREATE,
            SystemPermission.CUSTOMERS_EDIT,
            SystemPermission.CUSTOMERS_DELETE
          ];
          break;
          
        case UserRole.MANAGER:
          rolePermissions = [
            SystemPermission.CUSTOMERS_VIEW,
            SystemPermission.CUSTOMERS_CREATE,
            SystemPermission.CUSTOMERS_EDIT,
            SystemPermission.CUSTOMERS_DELETE
          ];
          break;
          
        case UserRole.EMPLOYEE:
          rolePermissions = [
            SystemPermission.CUSTOMERS_VIEW,
            SystemPermission.CUSTOMERS_CREATE,
            SystemPermission.CUSTOMERS_EDIT
          ];
          break;
          
        case UserRole.USER:
          rolePermissions = [
            SystemPermission.CUSTOMERS_VIEW
          ];
          break;
          
        default:
          rolePermissions = [];
      }
    }
    
    // Combine permissions
    setPermissions([...defaultPermissions, ...rolePermissions]);
    setIsLoading(false);
    
  }, [user]);
  
  /**
   * Checks if the user has a specific permission
   */
  const hasPermission = useCallback((permission: SystemPermission | string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);
  
  /**
   * Checks if the user has any of the given permissions
   */
  const hasAnyPermission = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  }, [permissions]);
  
  /**
   * Checks if the user has all of the given permissions
   */
  const hasAllPermissions = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission));
  }, [permissions]);
  
  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole: user?.role
  };
};
