'use client';

import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { useAuth } from '@/features/auth/providers/AuthProvider';

/**
 * Hook for customer-related permissions
 * Leverages the centralized permission provider system
 */
export const useCustomerPermissions = () => {
  const { user } = useAuth();
  // Use the centralized permission provider
  const permissions = usePermissions();

  return {
    ...permissions,
    userRole: user?.role
  };
};
