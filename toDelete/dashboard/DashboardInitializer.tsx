'use client';

/**
 * DashboardInitializer Component
 * 
 * Ensures users are authenticated before accessing dashboard pages and handles initialization
 * of required services for the dashboard in the proper sequence.
 */
import { useEffect, useState } from 'react';
import { ServerCodeErrorBoundary } from '@/shared/components/errors';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getLogger } from '@/core/logging';
import { ApiClient } from '@/core/api/ApiClient';

const logger = getLogger();

/**
 * DashboardInitializer
 * 
 * Ensures users are authenticated and permissions are loaded before accessing dashboard pages
 */
function DashboardInitializer() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [permissionsInitialized, setPermissionsInitialized] = useState(false);
  
  // First effect: Handle authentication check
  useEffect(() => {
    // If still loading auth state, wait for it
    if (isLoading) {
      return;
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      logger.info('User not authenticated, redirecting to login');
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
    } else {
      // User is authenticated, initialize API client
      ApiClient.initialize()
        .then(() => {
          // Once API client is initialized, we can finish the auth check
          logger.info('API client initialized for authenticated user');
          setIsChecking(false);
        })
        .catch(error => {
          logger.error('Error initializing API client in dashboard:', error);
          // Continue despite error to prevent dashboard from being blocked
          setIsChecking(false);
        });
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Second effect: Handle permission initialization
  useEffect(() => {
    // Skip if still checking auth or if permissions are already initialized
    if (isChecking || permissionsInitialized || !user?.id) {
      return;
    }
    
    const initializePermissions = async () => {
      try {
        // Import permission client dynamically to avoid circular dependencies
        const { PermissionClient } = await import('@/features/permissions/lib/clients/PermissionClient');
        
        // Load all user permissions
        logger.info(`Loading permissions for user ${user.id}`);
        const response = await PermissionClient.getUserPermissions(user.id);
        
        if (response.success && response.data) {
          logger.info(`Successfully loaded ${response.data.permissions?.length || 0} permissions for user`);
          setPermissionsInitialized(true);
        } else {
          // Log the error but don't block the dashboard
          logger.error('Failed to load permissions:', {
            status: response.statusCode,
            message: response.message
          });
          // Still mark as initialized to prevent hanging
          setPermissionsInitialized(true);
        }
      } catch (error) {
        // Log the error but still mark as initialized to prevent hanging
        logger.error('Error initializing permissions:', error as Error);
        setPermissionsInitialized(true);
      }
    };
    
    // Run initialization
    initializePermissions();
  }, [isChecking, user?.id, permissionsInitialized]);
  
  // Don't render anything until all checks are done
  // This prevents a flash of content before redirects or permission loading
  if (isChecking || (isAuthenticated && !permissionsInitialized)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-sm text-gray-500">
          Loading dashboard...
        </div>
      </div>
    );
  }
  
  // Otherwise render nothing - the actual dashboard content will be rendered by the layout
  return null;
}

// Export with error boundary
export default function DashboardInitializerWithErrorBoundary() {
  return (
    <ServerCodeErrorBoundary>
      <DashboardInitializer />
    </ServerCodeErrorBoundary>
  );
}
