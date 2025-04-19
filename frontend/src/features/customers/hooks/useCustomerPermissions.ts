'use client';

import { usePermissions } from '@/features/users/hooks/usePermissions';
import { useAuth } from '@/features/auth/providers/AuthProvider';

/**
 * Hook for customer-related permissions
 * Leverages the standard permission system
 */
export const useCustomerPermissions = () => {
  const { user } = useAuth();
  // Use the standard permission system
  const permissionsHook = usePermissions(user?.id);
  
  return {
    ...permissionsHook,
    userRole: user?.role
  };
};
